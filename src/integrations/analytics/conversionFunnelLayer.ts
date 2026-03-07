import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalConversionFunnelAdapter,
  type ConversionFunnelAdapter,
} from "./internalConversionFunnelAdapter";
import {
  CONVERSION_FUNNEL_EVENT_TYPE,
  type ConversionFunnelCommand,
  type ConversionFunnelEvent,
  type ConversionFunnelPayload,
  type ConversionFunnelQuery,
  type ConversionFunnelResult,
  type ConversionFunnelSnapshot,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isConversionFunnelEnabled = (command: ConversionFunnelCommand): boolean => {
  const flag = command.featureFlags?.conversionFunnelBaseline;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (
    flag.propertyId !== undefined &&
    (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)
  ) {
    return false;
  }
  return true;
};

const hasValidSignal = (command: ConversionFunnelCommand): boolean => {
  const signal = command.signal;
  if (!signal.campaign.trim()) return false;
  if (!signal.source.trim()) return false;
  if (!signal.medium.trim()) return false;
  if (Number.isNaN(new Date(signal.occurredAt).getTime())) return false;
  return true;
};

export interface ConversionFunnelLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: ConversionFunnelAdapter;
}

export class ConversionFunnelLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: ConversionFunnelAdapter;

  constructor({
    eventBus,
    outboxQueue,
    adapter,
  }: ConversionFunnelLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter ?? new InternalConversionFunnelAdapter();

    this.eventBus.registerHandler({
      eventType: CONVERSION_FUNNEL_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.upsertStage({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as ConversionFunnelPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: ConversionFunnelAdapter,
  ): ConversionFunnelLayerDependencies & { layer: ConversionFunnelLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new ConversionFunnelLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async upsertFunnelStage(command: ConversionFunnelCommand): Promise<ConversionFunnelResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isConversionFunnelEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidSignal(command)) {
      return { accepted: false, correlationId, reason: "invalid_signal" };
    }

    const event: ConversionFunnelEvent = {
      id: `funnel-${createSeed()}`,
      eventType: CONVERSION_FUNNEL_EVENT_TYPE,
      domain: "marketing",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        signal: command.signal,
        capturedAt: new Date().toISOString(),
      },
    };

    const outboxMessage = this.outboxQueue.enqueue(event as unknown as IntegrationEvent);
    await this.processOutboxMessage(outboxMessage);

    return {
      accepted: true,
      messageId: outboxMessage.messageId,
      correlationId,
    };
  }

  async getFunnelSnapshot(query: ConversionFunnelQuery): Promise<ConversionFunnelSnapshot> {
    return this.adapter.snapshot(query);
  }

  async retryDueMessages(now = new Date()): Promise<number> {
    const dueMessages = this.outboxQueue
      .listMessages()
      .filter(
        (message) =>
          message.status === "failed" &&
          message.nextAttemptAt !== undefined &&
          new Date(message.nextAttemptAt).getTime() <= now.getTime(),
      );

    for (const message of dueMessages) {
      await this.processOutboxMessage(message);
    }

    return dueMessages.length;
  }

  private async processOutboxMessage(message: OutboxMessage): Promise<void> {
    this.outboxQueue.markProcessing(message.messageId);
    const activeMessage = this.findOutboxMessage(message.messageId);
    if (!activeMessage) return;

    try {
      const publishResult = await this.eventBus.publish(activeMessage.event);
      if (publishResult.accepted) {
        this.outboxQueue.markSuccess(activeMessage.messageId);
        return;
      }

      this.outboxQueue.markFailure(
        activeMessage.messageId,
        `publish_${publishResult.reason ?? "rejected"}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown_error";
      this.outboxQueue.markFailure(activeMessage.messageId, errorMessage);
    }
  }

  private findOutboxMessage(messageId: string): OutboxMessage | undefined {
    return this.outboxQueue.listMessages().find((message) => message.messageId === messageId);
  }
}
