import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { InternalChannelProviderAdapter, type ChannelProviderAdapter } from "./ChannelProviderAdapter";
import {
  CHANNEL_ABSTRACTION_EVENT_TYPE,
  type ChannelAbstractionCommand,
  type ChannelAbstractionEvent,
  type ChannelAbstractionPayload,
  type ChannelAbstractionQuery,
  type ChannelAbstractionResult,
  type ChannelAbstractionSnapshot,
} from "./ChannelAbstractionTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: ChannelAbstractionCommand): boolean => {
  const flag = command.featureFlags?.distributionChannelAbstraction;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: ChannelAbstractionCommand): boolean => {
  const channel = command.channel;
  if (!channel.channelAccountId.trim()) return false;
  if (!command.idempotency.operation.trim()) return false;
  if (command.idempotency.orgId !== command.tenant.orgId) return false;
  if ((command.idempotency.propertyId ?? null) !== (command.tenant.propertyId ?? null)) return false;
  return true;
};

export class ChannelAbstractionLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: ChannelProviderAdapter;

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    adapter: ChannelProviderAdapter = new InternalChannelProviderAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: CHANNEL_ABSTRACTION_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.upsertChannel({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as ChannelAbstractionPayload,
        });
      },
    });
  }

  static bootstrap(adapter?: ChannelProviderAdapter): {
    layer: ChannelAbstractionLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new ChannelAbstractionLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async upsertChannel(command: ChannelAbstractionCommand): Promise<ChannelAbstractionResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: ChannelAbstractionEvent = {
      id: `channel-abstraction-${createSeed()}`,
      eventType: CHANNEL_ABSTRACTION_EVENT_TYPE,
      domain: "distribution",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        channel: command.channel,
        idempotency: command.idempotency,
        capturedAt: new Date().toISOString(),
      },
    };

    const message = this.outboxQueue.enqueue(event as unknown as IntegrationEvent);
    await this.processOutboxMessage(message);

    return {
      accepted: true,
      correlationId,
      messageId: message.messageId,
    };
  }

  async getSnapshot(query: ChannelAbstractionQuery): Promise<ChannelAbstractionSnapshot> {
    return this.adapter.snapshot(query);
  }

  private async processOutboxMessage(message: OutboxMessage): Promise<void> {
    this.outboxQueue.markProcessing(message.messageId);
    const active = this.outboxQueue.listMessages().find((item) => item.messageId === message.messageId);
    if (!active) return;

    try {
      const publishResult = await this.eventBus.publish(active.event);
      if (publishResult.accepted) {
        this.outboxQueue.markSuccess(active.messageId);
        return;
      }

      this.outboxQueue.markFailure(active.messageId, `publish_${publishResult.reason ?? "rejected"}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown_error";
      this.outboxQueue.markFailure(active.messageId, errorMessage);
    }
  }
}
