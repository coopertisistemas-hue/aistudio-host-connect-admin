import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { PricingRulesLayer, TariffCalendarLayer } from "@/modules/revenueManagement";
import { OtaMappingLayer } from "./OtaMappingLayer";
import { RateSyncAdapter } from "./RateSyncAdapter";
import {
  RATE_SYNC_EVENT_TYPE,
  type RateSyncCommand,
  type RateSyncEvent,
  type RateSyncPayload,
  type RateSyncQuery,
  type RateSyncRecord,
  type RateSyncResult,
  type RateSyncSnapshot,
} from "./RateSyncTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: RateSyncCommand): boolean => {
  const flag = command.featureFlags?.rateSyncBaseline;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: RateSyncCommand): boolean => {
  if (!command.provider.trim()) return false;
  if (command.rates.length === 0) return false;
  return command.rates.every((rate) => !Number.isNaN(new Date(rate.date).getTime()));
};

const key = (orgId: string, propertyId: string | null | undefined, provider: string, ratePlanId: string, roomTypeId: string, date: string, correlationId: string) =>
  `${orgId}:${propertyId ?? "__all"}:${provider}:${ratePlanId}:${roomTypeId}:${date}:${correlationId}`;

export class RateSyncLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly mappingLayer: OtaMappingLayer;
  private readonly tariffLayer: TariffCalendarLayer;
  private readonly pricingLayer: PricingRulesLayer;
  private readonly adapter: RateSyncAdapter;
  private readonly records = new Map<string, RateSyncRecord>();

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    mappingLayer: OtaMappingLayer,
    tariffLayer: TariffCalendarLayer,
    pricingLayer: PricingRulesLayer,
    adapter = new RateSyncAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.mappingLayer = mappingLayer;
    this.tariffLayer = tariffLayer;
    this.pricingLayer = pricingLayer;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: RATE_SYNC_EVENT_TYPE,
      handle: async (event) => {
        const payload = event.payload as RateSyncPayload;
        const tenant = { orgId: event.orgId, propertyId: event.propertyId };

        const mappingSnapshot = await this.mappingLayer.getSnapshot({ tenant, provider: payload.provider });
        const mapping = mappingSnapshot.records[0];
        if (!mapping) return;

        const ratePlanMap = new Map(
          mapping.ratePlans.map((plan) => [plan.internalRatePlanId, plan.channelRatePlanCode]),
        );

        for (const rateInput of payload.rates) {
          const channelRatePlanCode = ratePlanMap.get(rateInput.internalRatePlanId);
          if (!channelRatePlanCode) continue;

          const calendarSnapshot = await this.tariffLayer.getCalendar({
            tenant,
            dateFrom: rateInput.date,
            dateTo: rateInput.date,
          });

          const baseRate = calendarSnapshot.records[0]?.baseRate ?? 0;

          await this.pricingLayer.evaluate({
            tenant,
            correlationId: event.correlationId,
            targetDate: rateInput.date,
            baseRate,
            context: payload.context,
            rules: payload.pricingRules,
            featureFlags: {
              pricingRulesEngine: {
                enabled: true,
                orgId: tenant.orgId,
                propertyId: tenant.propertyId,
              },
            },
          });

          const pricingSnapshot = await this.pricingLayer.getSnapshot({ tenant, targetDate: rateInput.date });
          const suggestedRate = pricingSnapshot.records[0]?.suggestedRate ?? baseRate;

          const derived = this.adapter.deriveRecord({
            orgId: event.orgId,
            propertyId: event.propertyId,
            provider: payload.provider,
            date: rateInput.date,
            internalRoomTypeId: rateInput.internalRoomTypeId,
            internalRatePlanId: rateInput.internalRatePlanId,
            mappedChannelRatePlanCode: channelRatePlanCode,
            baseRate,
            suggestedRate,
            correlationId: event.correlationId,
          });

          const record: RateSyncRecord = {
            syncId: `rate-sync-${createSeed()}`,
            ...derived,
            updatedAt: new Date().toISOString(),
          };

          this.records.set(
            key(
              event.orgId,
              event.propertyId,
              payload.provider,
              rateInput.internalRatePlanId,
              rateInput.internalRoomTypeId,
              rateInput.date,
              event.correlationId,
            ),
            record,
          );
        }
      },
    });
  }

  static bootstrap(
    mappingLayer: OtaMappingLayer,
    tariffLayer: TariffCalendarLayer,
    pricingLayer: PricingRulesLayer,
    adapter?: RateSyncAdapter,
  ): {
    layer: RateSyncLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new RateSyncLayer(
      eventBus,
      outboxQueue,
      mappingLayer,
      tariffLayer,
      pricingLayer,
      adapter,
    );

    return { layer, eventBus, outboxQueue, observability };
  }

  async generateSyncPayload(command: RateSyncCommand): Promise<RateSyncResult> {
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

    const event: RateSyncEvent = {
      id: `rate-sync-${createSeed()}`,
      eventType: RATE_SYNC_EVENT_TYPE,
      domain: "distribution",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        provider: command.provider,
        context: command.context,
        pricingRules: command.pricingRules,
        rates: command.rates,
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

  async getSnapshot(query: RateSyncQuery): Promise<RateSyncSnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.provider || record.provider === query.provider)
      .filter((record) => !query.date || record.date === query.date)
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
