import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { InMemoryTelemetryAdapter, type TelemetryAdapter } from "./TelemetryAdapter";
import {
  TELEMETRY_EVENT_TYPE,
  type TelemetryCaptureCommand,
  type TelemetryCaptureResult,
  type TelemetryEvent,
  type TelemetryPayload,
  type TelemetryQuery,
  type TelemetrySnapshot,
} from "./TelemetryTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: TelemetryCaptureCommand): boolean => {
  const flag = command.featureFlags?.advancedObservability;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }

  return true;
};

const isValidPayload = (command: TelemetryCaptureCommand): boolean => {
  if (!command.eventType.trim()) return false;
  if (!command.module.trim()) return false;
  if (!command.message.trim()) return false;
  const timestamp = command.timestamp ?? new Date().toISOString();
  return !Number.isNaN(new Date(timestamp).getTime());
};

export class TelemetryLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: TelemetryAdapter;

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    adapter: TelemetryAdapter = new InMemoryTelemetryAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: TELEMETRY_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.capture({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as TelemetryPayload,
        });
      },
    });
  }

  static bootstrap(adapter?: TelemetryAdapter): {
    layer: TelemetryLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new TelemetryLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async capture(command: TelemetryCaptureCommand): Promise<TelemetryCaptureResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: TelemetryEvent = {
      id: `telemetry-${createSeed()}`,
      eventType: TELEMETRY_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        eventType: command.eventType,
        severity: command.severity,
        message: command.message,
        module: command.module,
        timestamp: command.timestamp ?? new Date().toISOString(),
        metadata: command.metadata,
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

  async getSnapshot(query: TelemetryQuery): Promise<TelemetrySnapshot> {
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
