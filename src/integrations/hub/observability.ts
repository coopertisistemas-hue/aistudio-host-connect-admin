import type {
  IntegrationAlert,
  IntegrationLogEntry,
  IntegrationMetricsSnapshot,
} from "./types";

interface AlertThresholds {
  noHandlerSpike: number;
  dlqSpike: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
  noHandlerSpike: 10,
  dlqSpike: 5,
};

export class IntegrationObservability {
  private readonly logs: IntegrationLogEntry[] = [];
  private readonly alerts: IntegrationAlert[] = [];
  private readonly thresholds: AlertThresholds;

  private metrics: IntegrationMetricsSnapshot = {
    publishedTotal: 0,
    publishAcceptedTotal: 0,
    publishDuplicateTotal: 0,
    publishNoHandlerTotal: 0,
    outboxEnqueuedTotal: 0,
    outboxSuccessTotal: 0,
    outboxFailedTotal: 0,
    outboxDeadLetterTotal: 0,
  };

  constructor(thresholds: Partial<AlertThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  addLog(entry: IntegrationLogEntry): void {
    this.logs.push(entry);
  }

  recordPublishResult(result: "accepted" | "duplicate" | "no_handler"): void {
    this.metrics.publishedTotal += 1;
    if (result === "accepted") this.metrics.publishAcceptedTotal += 1;
    if (result === "duplicate") this.metrics.publishDuplicateTotal += 1;
    if (result === "no_handler") this.metrics.publishNoHandlerTotal += 1;
    this.evaluateAlerts();
  }

  recordOutboxResult(result: "enqueued" | "success" | "failed" | "dead_letter"): void {
    if (result === "enqueued") this.metrics.outboxEnqueuedTotal += 1;
    if (result === "success") this.metrics.outboxSuccessTotal += 1;
    if (result === "failed") this.metrics.outboxFailedTotal += 1;
    if (result === "dead_letter") this.metrics.outboxDeadLetterTotal += 1;
    this.evaluateAlerts();
  }

  getMetricsSnapshot(): IntegrationMetricsSnapshot {
    return { ...this.metrics };
  }

  getRecentLogs(limit = 50): IntegrationLogEntry[] {
    return this.logs.slice(Math.max(0, this.logs.length - limit));
  }

  getActiveAlerts(): IntegrationAlert[] {
    return [...this.alerts];
  }

  private evaluateAlerts(): void {
    const now = new Date().toISOString();
    if (this.metrics.publishNoHandlerTotal >= this.thresholds.noHandlerSpike) {
      this.pushAlertOnce({
        code: "NO_HANDLER_SPIKE",
        severity: "warning",
        message: "Publish attempts without handler exceeded threshold.",
        triggeredAt: now,
      });
    }

    if (this.metrics.outboxDeadLetterTotal >= this.thresholds.dlqSpike) {
      this.pushAlertOnce({
        code: "DLQ_SPIKE",
        severity: "critical",
        message: "Dead-letter volume exceeded threshold.",
        triggeredAt: now,
      });
    }
  }

  private pushAlertOnce(alert: IntegrationAlert): void {
    const alreadyActive = this.alerts.some((existing) => existing.code === alert.code);
    if (!alreadyActive) {
      this.alerts.push(alert);
    }
  }
}

