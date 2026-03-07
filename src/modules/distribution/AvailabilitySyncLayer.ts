import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { AvailabilitySyncAdapter } from "./AvailabilitySyncAdapter";
import {
  AVAILABILITY_SYNC_EVENT_TYPE,
  type AvailabilitySyncCommand,
  type AvailabilitySyncEvent,
  type AvailabilitySyncPayload,
  type AvailabilitySyncQuery,
  type AvailabilitySyncRecord,
  type AvailabilitySyncResult,
  type AvailabilitySyncSnapshot,
} from "./AvailabilitySyncTypes";
import { OtaMappingLayer } from "./OtaMappingLayer";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: AvailabilitySyncCommand): boolean => {
  const flag = command.featureFlags?.availabilitySyncBaseline;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: AvailabilitySyncCommand): boolean => {
  if (!command.provider.trim()) return false;
  if (command.deltas.length === 0) return false;
  return command.deltas.every((delta) => {
    const dateValid = !Number.isNaN(new Date(delta.date).getTime());
    const unitsValid = Number.isInteger(delta.availableUnits) && delta.availableUnits >= 0;
    return !!delta.internalRoomTypeId.trim() && dateValid && unitsValid;
  });
};

const recordKey = (orgId: string, propertyId: string | null | undefined, provider: string, roomTypeId: string, date: string, correlationId: string) =>
  `${orgId}:${propertyId ?? "__all"}:${provider}:${roomTypeId}:${date}:${correlationId}`;

export class AvailabilitySyncLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly mappingLayer: OtaMappingLayer;
  private readonly adapter: AvailabilitySyncAdapter;
  private readonly records = new Map<string, AvailabilitySyncRecord>();

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    mappingLayer: OtaMappingLayer,
    adapter = new AvailabilitySyncAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.mappingLayer = mappingLayer;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: AVAILABILITY_SYNC_EVENT_TYPE,
      handle: async (event) => {
        const payload = event.payload as AvailabilitySyncPayload;
        const tenant = { orgId: event.orgId, propertyId: event.propertyId };

        const mappingSnapshot = await this.mappingLayer.getSnapshot({
          tenant,
          provider: payload.provider,
        });

        const mapping = mappingSnapshot.records[0];
        if (!mapping) return;

        const roomMap = new Map(mapping.rooms.map((room) => [room.internalRoomTypeId, room.channelRoomCode]));

        for (const delta of payload.deltas) {
          const channelRoomCode = roomMap.get(delta.internalRoomTypeId);
          if (!channelRoomCode) continue;

          const derived = this.adapter.deriveRecord({
            orgId: event.orgId,
            propertyId: event.propertyId,
            provider: payload.provider,
            delta,
            mappedChannelRoomCode: channelRoomCode,
            correlationId: event.correlationId,
          });

          const record: AvailabilitySyncRecord = {
            syncId: `availability-sync-${createSeed()}`,
            ...derived,
            updatedAt: new Date().toISOString(),
          };

          this.records.set(
            recordKey(
              event.orgId,
              event.propertyId,
              payload.provider,
              delta.internalRoomTypeId,
              delta.date,
              event.correlationId,
            ),
            record,
          );
        }
      },
    });
  }

  static bootstrap(mappingLayer: OtaMappingLayer, adapter?: AvailabilitySyncAdapter): {
    layer: AvailabilitySyncLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new AvailabilitySyncLayer(eventBus, outboxQueue, mappingLayer, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async generateSyncPayload(command: AvailabilitySyncCommand): Promise<AvailabilitySyncResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const mappingSnapshot = await this.mappingLayer.getSnapshot({
      tenant: command.tenant,
      provider: command.provider,
    });

    if (mappingSnapshot.records.length === 0) {
      return { accepted: false, correlationId, reason: "mapping_missing" };
    }

    const event: AvailabilitySyncEvent = {
      id: `availability-sync-${createSeed()}`,
      eventType: AVAILABILITY_SYNC_EVENT_TYPE,
      domain: "distribution",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        provider: command.provider,
        deltas: command.deltas,
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

  async getSnapshot(query: AvailabilitySyncQuery): Promise<AvailabilitySyncSnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.provider || record.provider === query.provider)
      .filter((record) => !query.date || record.targetDate === query.date)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
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
