import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { ReservationIngestionAdapter } from "./ReservationIngestionAdapter";
import {
  RESERVATION_INGESTION_EVENT_TYPE,
  type ReservationIngestionCommand,
  type ReservationIngestionEvent,
  type ReservationIngestionPayload,
  type ReservationIngestionQuery,
  type ReservationIngestionRecord,
  type ReservationIngestionResult,
  type ReservationIngestionSnapshot,
} from "./ReservationIngestionTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: ReservationIngestionCommand): boolean => {
  const flag = command.featureFlags?.reservationIngestionBaseline;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: ReservationIngestionCommand): boolean => {
  const inbound = command.inbound;
  if (!inbound.provider.trim()) return false;
  if (!inbound.providerReservationId.trim()) return false;
  if (!inbound.channelPropertyCode.trim()) return false;
  if (!inbound.channelRoomCode.trim()) return false;
  if (Number.isNaN(new Date(inbound.checkIn).getTime())) return false;
  if (Number.isNaN(new Date(inbound.checkOut).getTime())) return false;
  if (new Date(inbound.checkOut).getTime() <= new Date(inbound.checkIn).getTime()) return false;
  if (!Number.isInteger(inbound.guests) || inbound.guests <= 0) return false;
  if (!Number.isFinite(inbound.totalAmount) || inbound.totalAmount < 0) return false;
  if (!inbound.guest.fullName.trim()) return false;
  return true;
};

const key = (orgId: string, propertyId: string | null | undefined, provider: string, providerReservationId: string) =>
  `${orgId}:${propertyId ?? "__all"}:${provider}:${providerReservationId}`;

export class ReservationIngestionLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: ReservationIngestionAdapter;
  private readonly records = new Map<string, ReservationIngestionRecord>();
  private readonly idempotencyKeys = new Set<string>();

  constructor(eventBus: EventBus, outboxQueue: OutboxQueue, adapter = new ReservationIngestionAdapter()) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: RESERVATION_INGESTION_EVENT_TYPE,
      handle: async (event) => {
        const payload = event.payload as ReservationIngestionPayload;
        const derived = this.adapter.deriveRecord({
          orgId: event.orgId,
          propertyId: event.propertyId,
          inbound: payload.inbound,
          correlationId: event.correlationId,
        });

        if (this.idempotencyKeys.has(derived.idempotencyKey)) {
          return;
        }

        this.idempotencyKeys.add(derived.idempotencyKey);

        const record: ReservationIngestionRecord = {
          ingestionId: `reservation-ingestion-${createSeed()}`,
          ...derived,
          updatedAt: new Date().toISOString(),
        };

        this.records.set(
          key(event.orgId, event.propertyId, payload.inbound.provider, payload.inbound.providerReservationId),
          record,
        );
      },
    });
  }

  static bootstrap(adapter?: ReservationIngestionAdapter): {
    layer: ReservationIngestionLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new ReservationIngestionLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async ingest(command: ReservationIngestionCommand): Promise<ReservationIngestionResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: ReservationIngestionEvent = {
      id: `reservation-ingestion-${createSeed()}`,
      eventType: RESERVATION_INGESTION_EVENT_TYPE,
      domain: "distribution",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        inbound: command.inbound,
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

  async getSnapshot(query: ReservationIngestionQuery): Promise<ReservationIngestionSnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.provider || record.provider === query.provider)
      .filter(
        (record) =>
          !query.providerReservationId
          || record.providerReservationId === query.providerReservationId,
      )
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
