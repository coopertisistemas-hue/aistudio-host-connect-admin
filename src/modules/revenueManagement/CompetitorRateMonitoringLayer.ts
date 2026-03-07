import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { InternalCompetitorRateAdapter, type CompetitorRateAdapter } from "./CompetitorRateAdapter";
import {
  COMPETITOR_RATE_EVENT_TYPE,
  type CompetitorRateCommand,
  type CompetitorRateEvent,
  type CompetitorRatePayload,
  type CompetitorRateQuery,
  type CompetitorRateResult,
  type CompetitorRateSnapshot,
} from "./CompetitorRateTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: CompetitorRateCommand): boolean => {
  const flag = command.featureFlags?.competitorRateMonitoring;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: CompetitorRateCommand): boolean => {
  if (command.rates.length === 0) return false;
  return command.rates.every((rate) => {
    const dateValid = !Number.isNaN(new Date(rate.date).getTime());
    const rateValid = Number.isFinite(rate.rate) && rate.rate >= 0;
    return dateValid && rateValid && !!rate.competitorId.trim() && !!rate.competitorName.trim();
  });
};

export class CompetitorRateMonitoringLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: CompetitorRateAdapter;

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    adapter: CompetitorRateAdapter = new InternalCompetitorRateAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: COMPETITOR_RATE_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.ingest({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: { orgId: event.orgId, propertyId: event.propertyId },
          payload: event.payload as CompetitorRatePayload,
        });
      },
    });
  }

  static bootstrap(adapter?: CompetitorRateAdapter): {
    layer: CompetitorRateMonitoringLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new CompetitorRateMonitoringLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async ingestRates(command: CompetitorRateCommand): Promise<CompetitorRateResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: CompetitorRateEvent = {
      id: `competitor-rate-${createSeed()}`,
      eventType: COMPETITOR_RATE_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
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

  async getSnapshot(query: CompetitorRateQuery): Promise<CompetitorRateSnapshot> {
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
