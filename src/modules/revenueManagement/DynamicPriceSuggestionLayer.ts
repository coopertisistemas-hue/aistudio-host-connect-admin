import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { DynamicPriceSuggestionAdapter } from "./DynamicPriceSuggestionAdapter";
import { CompetitorRateMonitoringLayer } from "./CompetitorRateMonitoringLayer";
import {
  DYNAMIC_PRICE_SUGGESTION_EVENT_TYPE,
  type DynamicPriceSuggestionCommand,
  type DynamicPriceSuggestionEvent,
  type DynamicPriceSuggestionPayload,
  type DynamicPriceSuggestionQuery,
  type DynamicPriceSuggestionRecord,
  type DynamicPriceSuggestionResult,
  type DynamicPriceSuggestionSnapshot,
} from "./DynamicPriceSuggestionTypes";
import { PricingRulesLayer } from "./PricingRulesLayer";
import { TariffCalendarLayer } from "./TariffCalendarLayer";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: DynamicPriceSuggestionCommand): boolean => {
  const flag = command.featureFlags?.dynamicPriceSuggestion;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: DynamicPriceSuggestionCommand): boolean => {
  if (Number.isNaN(new Date(command.targetDate).getTime())) return false;
  if (!Number.isFinite(command.context.occupancySignal)) return false;
  if (!Number.isFinite(command.context.leadTimeDays) || command.context.leadTimeDays < 0) return false;
  return true;
};

const key = (orgId: string, propertyId: string | null | undefined, targetDate: string, correlationId: string) =>
  `${orgId}:${propertyId ?? "__all"}:${targetDate}:${correlationId}`;

export class DynamicPriceSuggestionLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly tariffCalendarLayer: TariffCalendarLayer;
  private readonly pricingRulesLayer: PricingRulesLayer;
  private readonly competitorRateLayer: CompetitorRateMonitoringLayer;
  private readonly adapter: DynamicPriceSuggestionAdapter;
  private readonly records = new Map<string, DynamicPriceSuggestionRecord>();

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    tariffCalendarLayer: TariffCalendarLayer,
    pricingRulesLayer: PricingRulesLayer,
    competitorRateLayer: CompetitorRateMonitoringLayer,
    adapter = new DynamicPriceSuggestionAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.tariffCalendarLayer = tariffCalendarLayer;
    this.pricingRulesLayer = pricingRulesLayer;
    this.competitorRateLayer = competitorRateLayer;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: DYNAMIC_PRICE_SUGGESTION_EVENT_TYPE,
      handle: async (event) => {
        const payload = event.payload as DynamicPriceSuggestionPayload;
        const tenant = { orgId: event.orgId, propertyId: event.propertyId };

        const [calendarSnapshot, competitorSnapshot] = await Promise.all([
          this.tariffCalendarLayer.getCalendar({ tenant, dateFrom: payload.targetDate, dateTo: payload.targetDate }),
          this.competitorRateLayer.getSnapshot({ tenant, date: payload.targetDate }),
        ]);

        const baseRate = calendarSnapshot.records[0]?.baseRate ?? 0;

        await this.pricingRulesLayer.evaluate({
          tenant,
          correlationId: event.correlationId,
          targetDate: payload.targetDate,
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

        const pricingSnapshot = await this.pricingRulesLayer.getSnapshot({ tenant, targetDate: payload.targetDate });
        const rulesSuggestedRate = pricingSnapshot.records[0]?.suggestedRate ?? baseRate;

        const competitorRates = competitorSnapshot.records.map((record) => record.rate);
        const competitorAverageRate = competitorRates.length > 0
          ? competitorRates.reduce((sum, current) => sum + current, 0) / competitorRates.length
          : undefined;

        const derived = this.adapter.derive({
          targetDate: payload.targetDate,
          baseRate,
          rulesSuggestedRate,
          competitorAverageRate,
          orgId: tenant.orgId,
          propertyId: tenant.propertyId,
          correlationId: event.correlationId,
        });

        const now = new Date().toISOString();
        const record: DynamicPriceSuggestionRecord = {
          suggestionId: `dynamic-price-${createSeed()}`,
          ...derived,
          updatedAt: now,
        };

        this.records.set(key(event.orgId, event.propertyId, payload.targetDate, event.correlationId), record);
      },
    });
  }

  static bootstrap(
    tariffCalendarLayer: TariffCalendarLayer,
    pricingRulesLayer: PricingRulesLayer,
    competitorRateLayer: CompetitorRateMonitoringLayer,
    adapter?: DynamicPriceSuggestionAdapter,
  ): {
    layer: DynamicPriceSuggestionLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new DynamicPriceSuggestionLayer(
      eventBus,
      outboxQueue,
      tariffCalendarLayer,
      pricingRulesLayer,
      competitorRateLayer,
      adapter,
    );

    return { layer, eventBus, outboxQueue, observability };
  }

  async evaluate(command: DynamicPriceSuggestionCommand): Promise<DynamicPriceSuggestionResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: DynamicPriceSuggestionEvent = {
      id: `dynamic-price-${createSeed()}`,
      eventType: DYNAMIC_PRICE_SUGGESTION_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        targetDate: command.targetDate,
        context: command.context,
        pricingRules: command.pricingRules,
        evaluatedAt: new Date().toISOString(),
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

  async getSnapshot(query: DynamicPriceSuggestionQuery): Promise<DynamicPriceSuggestionSnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.targetDate || record.targetDate === query.targetDate)
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
