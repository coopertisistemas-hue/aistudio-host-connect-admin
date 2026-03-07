import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { PricingRulesEngine } from "./PricingRulesEngine";
import {
  PRICING_RULES_EVENT_TYPE,
  type PricingRuleEvaluationRecord,
  type PricingRulesCommand,
  type PricingRulesEvent,
  type PricingRulesPayload,
  type PricingRulesQuery,
  type PricingRulesResult,
  type PricingRulesSnapshot,
} from "./PricingRulesTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: PricingRulesCommand): boolean => {
  const flag = command.featureFlags?.pricingRulesEngine;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: PricingRulesCommand): boolean => {
  if (Number.isNaN(new Date(command.targetDate).getTime())) return false;
  if (!Number.isFinite(command.baseRate) || command.baseRate < 0) return false;
  if (!Number.isFinite(command.context.occupancySignal)) return false;
  if (!Number.isFinite(command.context.leadTimeDays) || command.context.leadTimeDays < 0) return false;
  return true;
};

const recordKey = (orgId: string, propertyId: string | null | undefined, targetDate: string, correlationId: string) =>
  `${orgId}:${propertyId ?? "__all"}:${targetDate}:${correlationId}`;

export class PricingRulesLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly engine: PricingRulesEngine;
  private readonly records = new Map<string, PricingRuleEvaluationRecord>();

  constructor(eventBus: EventBus, outboxQueue: OutboxQueue, engine = new PricingRulesEngine()) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.engine = engine;

    this.eventBus.registerHandler({
      eventType: PRICING_RULES_EVENT_TYPE,
      handle: async (event) => {
        const payload = event.payload as PricingRulesPayload;
        const evaluated = this.engine.evaluate(
          {
            tenant: { orgId: event.orgId, propertyId: event.propertyId },
            correlationId: event.correlationId,
            targetDate: payload.targetDate,
            baseRate: payload.baseRate,
            context: payload.context,
            rules: payload.rules,
          },
          event.correlationId,
        );

        const evaluationId = `pricing-eval-${createSeed()}`;
        const now = new Date().toISOString();
        const record: PricingRuleEvaluationRecord = {
          evaluationId,
          orgId: event.orgId,
          propertyId: event.propertyId,
          ...evaluated,
          updatedAt: now,
        };

        this.records.set(recordKey(event.orgId, event.propertyId, payload.targetDate, event.correlationId), record);
      },
    });
  }

  static bootstrap(engine?: PricingRulesEngine): {
    layer: PricingRulesLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new PricingRulesLayer(eventBus, outboxQueue, engine);

    return { layer, eventBus, outboxQueue, observability };
  }

  async evaluate(command: PricingRulesCommand): Promise<PricingRulesResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: PricingRulesEvent = {
      id: `pricing-rules-${createSeed()}`,
      eventType: PRICING_RULES_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        targetDate: command.targetDate,
        baseRate: command.baseRate,
        context: command.context,
        rules: command.rules,
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

  async getSnapshot(query: PricingRulesQuery): Promise<PricingRulesSnapshot> {
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
