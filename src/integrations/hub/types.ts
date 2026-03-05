export type IntegrationDomain =
  | "communication"
  | "marketing"
  | "distribution"
  | "compliance"
  | "payments"
  | "other";

export interface IntegrationEvent<TPayload = Record<string, unknown>> {
  id: string;
  eventType: string;
  domain: IntegrationDomain;
  orgId: string;
  propertyId?: string | null;
  correlationId: string;
  payload: TPayload;
  createdAt: string;
}

export interface OutboxMessage {
  messageId: string;
  event: IntegrationEvent;
  status: "pending" | "processing" | "succeeded" | "failed" | "dead_letter";
  attempt: number;
  nextAttemptAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number;
}

export interface IntegrationEventHandler {
  eventType: string;
  handle: (event: IntegrationEvent) => Promise<void>;
}

export interface IntegrationLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  component: "event_bus" | "outbox_queue" | "worker";
  eventType?: string;
  messageId?: string;
  orgId?: string;
  propertyId?: string | null;
  correlationId?: string;
  status: string;
  latencyMs?: number;
  retryCount?: number;
  errorCode?: string;
  message: string;
}

export interface IntegrationMetricsSnapshot {
  publishedTotal: number;
  publishAcceptedTotal: number;
  publishDuplicateTotal: number;
  publishNoHandlerTotal: number;
  outboxEnqueuedTotal: number;
  outboxSuccessTotal: number;
  outboxFailedTotal: number;
  outboxDeadLetterTotal: number;
}

export interface IntegrationAlert {
  code: "NO_HANDLER_SPIKE" | "DLQ_SPIKE";
  severity: "warning" | "critical";
  message: string;
  triggeredAt: string;
}

