import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { IntegrationHealthAdapter } from "./IntegrationHealthAdapter";
import {
  INTEGRATION_HEALTH_EVENT_TYPE,
  type IntegrationHealthCommand,
  type IntegrationHealthEvent,
  type IntegrationHealthPayload,
  type IntegrationHealthQuery,
  type IntegrationHealthResult,
  type IntegrationHealthSignal,
  type IntegrationHealthSnapshot,
} from "./IntegrationHealthTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: IntegrationHealthCommand): boolean => {
  const flag = command.featureFlags?.integrationHealthMonitoring;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }

  return true;
};

const isValidPayload = (command: IntegrationHealthCommand): boolean => {
  if (command.inputs.length === 0) return false;
  return command.inputs.every((input) =>
    !!input.module.trim()
    && input.eventsProcessed >= 0
    && input.failedEvents >= 0
    && input.retryQueueDepth >= 0
    && input.deadLetterDepth >= 0,
  );
};

const key = (orgId: string, propertyId: string | null | undefined, module: string, correlationId: string) =>
  `${orgId}:${propertyId ?? "__all"}:${module}:${correlationId}`;

export class IntegrationHealthLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: IntegrationHealthAdapter;
  private readonly signals = new Map<string, IntegrationHealthSignal>();

  constructor(eventBus: EventBus, outboxQueue: OutboxQueue, adapter = new IntegrationHealthAdapter()) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: INTEGRATION_HEALTH_EVENT_TYPE,
      handle: async (event) => {
        const payload = event.payload as IntegrationHealthPayload;
        for (const metric of payload.inputs) {
          const derived = this.adapter.deriveSignal({
            orgId: event.orgId,
            propertyId: event.propertyId,
            metric,
            correlationId: event.correlationId,
          });

          const signal: IntegrationHealthSignal = {
            signalId: `health-${createSeed()}`,
            ...derived,
            updatedAt: new Date().toISOString(),
          };

          this.signals.set(key(event.orgId, event.propertyId, metric.module, event.correlationId), signal);
        }
      },
    });
  }

  static bootstrap(adapter?: IntegrationHealthAdapter): {
    layer: IntegrationHealthLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new IntegrationHealthLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async evaluate(command: IntegrationHealthCommand): Promise<IntegrationHealthResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: IntegrationHealthEvent = {
      id: `health-${createSeed()}`,
      eventType: INTEGRATION_HEALTH_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        inputs: command.inputs,
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

  async getSnapshot(query: IntegrationHealthQuery): Promise<IntegrationHealthSnapshot> {
    const signals = Array.from(this.signals.values())
      .filter((signal) => signal.orgId === query.tenant.orgId)
      .filter((signal) => !query.tenant.propertyId || signal.propertyId === query.tenant.propertyId)
      .filter((signal) => !query.module || signal.module === query.module)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      tenant: query.tenant,
      signals,
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
