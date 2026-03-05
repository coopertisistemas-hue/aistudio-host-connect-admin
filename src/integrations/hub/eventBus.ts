import { EventRegistry } from "./eventRegistry";
import type { IntegrationObservability } from "./observability";
import type { IntegrationEvent, IntegrationEventHandler } from "./types";

export interface PublishResult {
  accepted: boolean;
  reason?: "duplicate" | "no_handler";
}

export class EventBus {
  private readonly registry = new EventRegistry();
  private readonly dedupe = new Set<string>();
  private readonly observability?: IntegrationObservability;

  constructor(observability?: IntegrationObservability) {
    this.observability = observability;
  }

  registerHandler(handler: IntegrationEventHandler): void {
    this.registry.register(handler);
  }

  getRegisteredEventTypes(): string[] {
    return this.registry.listRegisteredEventTypes();
  }

  async publish(event: IntegrationEvent): Promise<PublishResult> {
    const startedAt = Date.now();
    const dedupeKey = `${event.id}:${event.eventType}`;
    if (this.dedupe.has(dedupeKey)) {
      this.observability?.recordPublishResult("duplicate");
      this.observability?.addLog({
        timestamp: new Date().toISOString(),
        level: "warn",
        component: "event_bus",
        eventType: event.eventType,
        orgId: event.orgId,
        propertyId: event.propertyId,
        correlationId: event.correlationId,
        status: "duplicate",
        latencyMs: Date.now() - startedAt,
        message: "Duplicate event publish detected.",
      });
      return { accepted: false, reason: "duplicate" };
    }

    const handler = this.registry.resolve(event.eventType);
    if (!handler) {
      this.observability?.recordPublishResult("no_handler");
      this.observability?.addLog({
        timestamp: new Date().toISOString(),
        level: "warn",
        component: "event_bus",
        eventType: event.eventType,
        orgId: event.orgId,
        propertyId: event.propertyId,
        correlationId: event.correlationId,
        status: "no_handler",
        latencyMs: Date.now() - startedAt,
        message: "No handler registered for event type.",
      });
      return { accepted: false, reason: "no_handler" };
    }

    this.dedupe.add(dedupeKey);
    await handler.handle(event);
    this.observability?.recordPublishResult("accepted");
    this.observability?.addLog({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "event_bus",
      eventType: event.eventType,
      orgId: event.orgId,
      propertyId: event.propertyId,
      correlationId: event.correlationId,
      status: "accepted",
      latencyMs: Date.now() - startedAt,
      message: "Event published and handled successfully.",
    });
    return { accepted: true };
  }
}
