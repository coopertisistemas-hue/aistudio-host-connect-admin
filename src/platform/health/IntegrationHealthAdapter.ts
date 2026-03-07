import type {
  IntegrationHealthInput,
  IntegrationHealthSignal,
} from "./IntegrationHealthTypes";

export class IntegrationHealthAdapter {
  deriveSignal(input: {
    orgId: string;
    propertyId?: string | null;
    metric: IntegrationHealthInput;
    correlationId: string;
  }): Omit<IntegrationHealthSignal, "signalId" | "updatedAt"> {
    const failureRate = input.metric.eventsProcessed > 0
      ? input.metric.failedEvents / input.metric.eventsProcessed
      : 0;

    let status: IntegrationHealthSignal["status"] = "healthy";
    let score = 100;

    score -= Math.min(40, Math.round(failureRate * 100));
    score -= Math.min(30, input.metric.retryQueueDepth);
    score -= Math.min(30, input.metric.deadLetterDepth * 3);
    score = Math.max(0, score);

    if (score < 40 || input.metric.deadLetterDepth > 10) {
      status = "critical";
    } else if (score < 75 || input.metric.retryQueueDepth > 20) {
      status = "degraded";
    }

    const suggestion =
      status === "healthy"
        ? "monitor"
        : status === "degraded"
          ? "review_retry_and_queue_depth"
          : "investigate_dlq_and_failures";

    return {
      orgId: input.orgId,
      propertyId: input.propertyId,
      module: input.metric.module,
      status,
      score,
      indicators: {
        eventsProcessed: input.metric.eventsProcessed,
        failedEvents: input.metric.failedEvents,
        retryQueueDepth: input.metric.retryQueueDepth,
        deadLetterDepth: input.metric.deadLetterDepth,
      },
      remediation: {
        automaticActionTaken: false,
        suggestion,
      },
      correlationId: input.correlationId,
    };
  }
}
