import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { InternalOtaMappingAdapter, type OtaMappingAdapter } from "./OtaMappingAdapter";
import {
  OTA_MAPPING_EVENT_TYPE,
  type OtaMappingCommand,
  type OtaMappingEvent,
  type OtaMappingPayload,
  type OtaMappingQuery,
  type OtaMappingResult,
  type OtaMappingSnapshot,
} from "./OtaMappingTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: OtaMappingCommand): boolean => {
  const flag = command.featureFlags?.otaMappingContracts;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: OtaMappingCommand): boolean => {
  const mapping = command.mapping;
  if (!mapping.provider.trim()) return false;
  if (!mapping.property.internalPropertyId.trim()) return false;
  if (!mapping.property.channelPropertyCode.trim()) return false;
  if (mapping.mappingVersion < 1) return false;

  const roomUnique = new Set(mapping.rooms.map((room) => room.internalRoomTypeId));
  const planUnique = new Set(mapping.ratePlans.map((plan) => plan.internalRatePlanId));

  return roomUnique.size === mapping.rooms.length && planUnique.size === mapping.ratePlans.length;
};

export class OtaMappingLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: OtaMappingAdapter;

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    adapter: OtaMappingAdapter = new InternalOtaMappingAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: OTA_MAPPING_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.upsert({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: { orgId: event.orgId, propertyId: event.propertyId },
          payload: event.payload as OtaMappingPayload,
        });
      },
    });
  }

  static bootstrap(adapter?: OtaMappingAdapter): {
    layer: OtaMappingLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new OtaMappingLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async upsertMapping(command: OtaMappingCommand): Promise<OtaMappingResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: OtaMappingEvent = {
      id: `ota-mapping-${createSeed()}`,
      eventType: OTA_MAPPING_EVENT_TYPE,
      domain: "distribution",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        mapping: command.mapping,
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

  async getSnapshot(query: OtaMappingQuery): Promise<OtaMappingSnapshot> {
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
