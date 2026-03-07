import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { PerformanceAdapter } from "./PerformanceAdapter";
import {
  PERFORMANCE_METRIC_EVENT_TYPE,
  type PerformanceCommand,
  type PerformanceMetricEvent,
  type PerformancePayload,
  type PerformanceQuery,
  type PerformanceMetricRecord,
  type PerformanceResult,
  type PerformanceSnapshot,
} from "./PerformanceMetricTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: PerformanceCommand): boolean => {
  const flag = command.featureFlags?.performanceBaseline;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: PerformanceCommand): boolean => {
  if (command.metrics.length === 0) return false;
  const metricsValid = command.metrics.every((metric) =>
    !!metric.module.trim()
    && !!metric.eventType.trim()
    && metric.eventsProcessed >= 0
    && metric.windowSeconds > 0
    && metric.avgProcessingLatencyMs >= 0
    && metric.p95ProcessingLatencyMs >= 0
    && metric.queueDepth >= 0,
  );

  if (!metricsValid) return false;

  if (!command.syntheticLoadTest) return true;
  return command.syntheticLoadTest.targetEventsPerSecond > 0
    && command.syntheticLoadTest.durationSeconds > 0
    && !!command.syntheticLoadTest.module.trim();
};

const key = (orgId: string, propertyId: string | null | undefined, module: string, eventType: string, correlationId: string) =>
  `${orgId}:${propertyId ?? "__all"}:${module}:${eventType}:${correlationId}`;

export class PerformanceLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: PerformanceAdapter;
  private readonly records = new Map<string, PerformanceMetricRecord>();

  constructor(eventBus: EventBus, outboxQueue: OutboxQueue, adapter = new PerformanceAdapter()) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: PERFORMANCE_METRIC_EVENT_TYPE,
      handle: async (event) => {
        const payload = event.payload as PerformancePayload;

        for (const metric of payload.metrics) {
          const derived = this.adapter.deriveRecord({
            orgId: event.orgId,
            propertyId: event.propertyId,
            metric,
            correlationId: event.correlationId,
            syntheticLoadTest:
              payload.syntheticLoadTest?.module === metric.module
                ? payload.syntheticLoadTest
                : undefined,
          });

          const record: PerformanceMetricRecord = {
            recordId: `perf-${createSeed()}`,
            ...derived,
            updatedAt: new Date().toISOString(),
          };

          this.records.set(key(event.orgId, event.propertyId, metric.module, metric.eventType, event.correlationId), record);
        }
      },
    });
  }

  static bootstrap(adapter?: PerformanceAdapter): {
    layer: PerformanceLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new PerformanceLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async capture(command: PerformanceCommand): Promise<PerformanceResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: PerformanceMetricEvent = {
      id: `performance-${createSeed()}`,
      eventType: PERFORMANCE_METRIC_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        metrics: command.metrics,
        syntheticLoadTest: command.syntheticLoadTest,
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

  async getSnapshot(query: PerformanceQuery): Promise<PerformanceSnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.module || record.module === query.module)
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
