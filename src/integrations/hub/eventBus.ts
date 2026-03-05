import { EventRegistry } from "./eventRegistry";
import type { IntegrationEvent, IntegrationEventHandler } from "./types";

export interface PublishResult {
  accepted: boolean;
  reason?: "duplicate" | "no_handler";
}

export class EventBus {
  private readonly registry = new EventRegistry();
  private readonly dedupe = new Set<string>();

  registerHandler(handler: IntegrationEventHandler): void {
    this.registry.register(handler);
  }

  getRegisteredEventTypes(): string[] {
    return this.registry.listRegisteredEventTypes();
  }

  async publish(event: IntegrationEvent): Promise<PublishResult> {
    const dedupeKey = `${event.id}:${event.eventType}`;
    if (this.dedupe.has(dedupeKey)) {
      return { accepted: false, reason: "duplicate" };
    }

    const handler = this.registry.resolve(event.eventType);
    if (!handler) {
      return { accepted: false, reason: "no_handler" };
    }

    this.dedupe.add(dedupeKey);
    await handler.handle(event);
    return { accepted: true };
  }
}

