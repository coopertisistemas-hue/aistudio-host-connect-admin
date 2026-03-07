import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalAttributionAdapter,
  type AttributionAdapter,
} from "./internalAttributionAdapter";
import {
  ATTRIBUTION_OUTCOME_LINK_EVENT_TYPE,
  ATTRIBUTION_TOUCHPOINT_EVENT_TYPE,
  type AttributionBaselineResult,
  type AttributionOutcomeLinkCommand,
  type AttributionOutcomeLinkEvent,
  type AttributionOutcomeLinkPayload,
  type AttributionQuery,
  type AttributionSnapshot,
  type AttributionTouchpointCommand,
  type AttributionTouchpointEvent,
  type AttributionTouchpointPayload,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isAttributionEngineEnabled = (
  command:
    | AttributionTouchpointCommand
    | AttributionOutcomeLinkCommand,
): boolean => {
  const flag = command.featureFlags?.attributionEngineBaseline;
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

const hasValidTouchpoint = (command: AttributionTouchpointCommand): boolean => {
  const touchpoint = command.touchpoint;
  if (!touchpoint.campaign.trim()) return false;
  if (!touchpoint.source.trim()) return false;
  if (!touchpoint.medium.trim()) return false;
  if (Number.isNaN(new Date(touchpoint.occurredAt).getTime())) return false;
  return true;
};

const hasValidOutcome = (command: AttributionOutcomeLinkCommand): boolean => {
  const outcome = command.outcome;
  if (!outcome.touchpointId && !outcome.clickIdentifier) return false;
  if (!outcome.leadId && !outcome.reservationId) return false;
  if (Number.isNaN(new Date(outcome.linkedAt).getTime())) return false;
  return true;
};

export interface AttributionEngineLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: AttributionAdapter;
}

export class AttributionEngineLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: AttributionAdapter;

  constructor({
    eventBus,
    outboxQueue,
    adapter,
  }: AttributionEngineLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter ?? new InternalAttributionAdapter();

    this.eventBus.registerHandler({
      eventType: ATTRIBUTION_TOUCHPOINT_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.recordTouchpoint({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as AttributionTouchpointPayload,
        });
      },
    });

    this.eventBus.registerHandler({
      eventType: ATTRIBUTION_OUTCOME_LINK_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.linkOutcome({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as AttributionOutcomeLinkPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: AttributionAdapter,
  ): AttributionEngineLayerDependencies & { layer: AttributionEngineLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new AttributionEngineLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async recordTouchpoint(
    command: AttributionTouchpointCommand,
  ): Promise<AttributionBaselineResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isAttributionEngineEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidTouchpoint(command)) {
      return { accepted: false, correlationId, reason: "invalid_touchpoint" };
    }

    const event: AttributionTouchpointEvent = {
      id: `attr-touchpoint-${createSeed()}`,
      eventType: ATTRIBUTION_TOUCHPOINT_EVENT_TYPE,
      domain: "marketing",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        model: command.model ?? "unknown",
        touchpoint: command.touchpoint,
        recordedAt: new Date().toISOString(),
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

  async linkOutcome(command: AttributionOutcomeLinkCommand): Promise<AttributionBaselineResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isAttributionEngineEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidOutcome(command)) {
      return { accepted: false, correlationId, reason: "invalid_outcome" };
    }

    const event: AttributionOutcomeLinkEvent = {
      id: `attr-outcome-${createSeed()}`,
      eventType: ATTRIBUTION_OUTCOME_LINK_EVENT_TYPE,
      domain: "marketing",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        outcome: command.outcome,
        linkedAt: new Date().toISOString(),
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

  async getAttributionSnapshot(query: AttributionQuery): Promise<AttributionSnapshot> {
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
