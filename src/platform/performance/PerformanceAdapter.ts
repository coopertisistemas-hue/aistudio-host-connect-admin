import type {
  PerformanceMetricInput,
  PerformanceMetricRecord,
  SyntheticLoadTestInput,
} from "./PerformanceMetricTypes";

export class PerformanceAdapter {
  deriveRecord(input: {
    orgId: string;
    propertyId?: string | null;
    metric: PerformanceMetricInput;
    correlationId: string;
    syntheticLoadTest?: SyntheticLoadTestInput;
  }): Omit<PerformanceMetricRecord, "recordId" | "updatedAt"> {
    const throughputPerSecond =
      input.metric.windowSeconds > 0
        ? Number((input.metric.eventsProcessed / input.metric.windowSeconds).toFixed(2))
        : 0;

    return {
      orgId: input.orgId,
      propertyId: input.propertyId,
      module: input.metric.module,
      eventType: input.metric.eventType,
      throughputPerSecond,
      avgProcessingLatencyMs: input.metric.avgProcessingLatencyMs,
      p95ProcessingLatencyMs: input.metric.p95ProcessingLatencyMs,
      queueDepth: input.metric.queueDepth,
      syntheticLoadBaseline: input.syntheticLoadTest
        ? {
            targetEventsPerSecond: input.syntheticLoadTest.targetEventsPerSecond,
            durationSeconds: input.syntheticLoadTest.durationSeconds,
            status: "executed_placeholder",
          }
        : undefined,
      advisoryOnly: true,
      correlationId: input.correlationId,
    };
  }
}
