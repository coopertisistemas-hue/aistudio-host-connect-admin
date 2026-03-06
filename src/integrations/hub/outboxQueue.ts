import type { IntegrationObservability } from "./observability";
import type { IntegrationEvent, OutboxMessage, RetryPolicy } from "./types";

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitterMs: 250,
};

const nowIso = () => new Date().toISOString();

export class OutboxQueue {
  private readonly messages = new Map<string, OutboxMessage>();
  private readonly deadLetter = new Map<string, OutboxMessage>();
  private readonly retryPolicy: RetryPolicy;
  private readonly observability?: IntegrationObservability;

  constructor(
    retryPolicy: Partial<RetryPolicy> = {},
    observability?: IntegrationObservability,
  ) {
    this.retryPolicy = { ...DEFAULT_RETRY_POLICY, ...retryPolicy };
    this.observability = observability;
  }

  enqueue(event: IntegrationEvent): OutboxMessage {
    const timestamp = nowIso();
    const message: OutboxMessage = {
      messageId: `${event.id}:${event.eventType}`,
      event,
      status: "pending",
      attempt: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.messages.set(message.messageId, message);
    this.observability?.recordOutboxResult("enqueued");
    this.observability?.addLog({
      timestamp: timestamp,
      level: "info",
      component: "outbox_queue",
      eventType: event.eventType,
      messageId: message.messageId,
      orgId: event.orgId,
      propertyId: event.propertyId,
      correlationId: event.correlationId,
      status: "enqueued",
      message: "Outbox message enqueued.",
    });
    return message;
  }

  markProcessing(messageId: string): void {
    const existing = this.messages.get(messageId);
    if (!existing) return;

    this.messages.set(messageId, {
      ...existing,
      status: "processing",
      updatedAt: nowIso(),
    });
  }

  markSuccess(messageId: string): void {
    const existing = this.messages.get(messageId);
    if (!existing) return;

    this.messages.set(messageId, {
      ...existing,
      status: "succeeded",
      updatedAt: nowIso(),
    });
    this.observability?.recordOutboxResult("success");
    this.observability?.addLog({
      timestamp: nowIso(),
      level: "info",
      component: "outbox_queue",
      eventType: existing.event.eventType,
      messageId: existing.messageId,
      orgId: existing.event.orgId,
      propertyId: existing.event.propertyId,
      correlationId: existing.event.correlationId,
      retryCount: existing.attempt,
      status: "succeeded",
      message: "Outbox message processed successfully.",
    });
  }

  markFailure(messageId: string, errorMessage: string): OutboxMessage | undefined {
    const existing = this.messages.get(messageId);
    if (!existing) return undefined;

    const nextAttempt = existing.attempt + 1;
    const shouldDeadLetter = nextAttempt >= this.retryPolicy.maxAttempts;
    const timestamp = nowIso();

    const failedMessage: OutboxMessage = {
      ...existing,
      attempt: nextAttempt,
      status: shouldDeadLetter ? "dead_letter" : "failed",
      lastError: errorMessage,
      nextAttemptAt: shouldDeadLetter
        ? undefined
        : new Date(Date.now() + this.computeBackoffMs(nextAttempt)).toISOString(),
      updatedAt: timestamp,
    };

    if (shouldDeadLetter) {
      this.deadLetter.set(messageId, failedMessage);
      this.observability?.recordOutboxResult("dead_letter");
      this.observability?.addLog({
        timestamp: timestamp,
        level: "error",
        component: "outbox_queue",
        eventType: existing.event.eventType,
        messageId: existing.messageId,
        orgId: existing.event.orgId,
        propertyId: existing.event.propertyId,
        correlationId: existing.event.correlationId,
        retryCount: failedMessage.attempt,
        status: "dead_letter",
        errorCode: "RETRY_EXHAUSTED",
        message: "Outbox message moved to dead-letter queue.",
      });
    } else {
      this.observability?.recordOutboxResult("failed");
      this.observability?.addLog({
        timestamp: timestamp,
        level: "warn",
        component: "outbox_queue",
        eventType: existing.event.eventType,
        messageId: existing.messageId,
        orgId: existing.event.orgId,
        propertyId: existing.event.propertyId,
        correlationId: existing.event.correlationId,
        retryCount: failedMessage.attempt,
        status: "failed",
        errorCode: "RETRY_SCHEDULED",
        message: "Outbox message failed and was scheduled for retry.",
      });
    }

    this.messages.set(messageId, failedMessage);
    return failedMessage;
  }

  listMessages(): OutboxMessage[] {
    return Array.from(this.messages.values()).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  listDeadLetter(): OutboxMessage[] {
    return Array.from(this.deadLetter.values()).sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
  }

  private computeBackoffMs(attempt: number): number {
    const exponential = Math.min(
      this.retryPolicy.maxDelayMs,
      this.retryPolicy.baseDelayMs *
        Math.pow(this.retryPolicy.backoffMultiplier, Math.max(0, attempt - 1)),
    );
    const jitter = Math.floor(Math.random() * this.retryPolicy.jitterMs);
    return exponential + jitter;
  }
}
