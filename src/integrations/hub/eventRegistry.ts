import type { IntegrationEventHandler } from "./types";

export class EventRegistry {
  private readonly handlers = new Map<string, IntegrationEventHandler>();

  register(handler: IntegrationEventHandler): void {
    this.handlers.set(handler.eventType, handler);
  }

  unregister(eventType: string): void {
    this.handlers.delete(eventType);
  }

  resolve(eventType: string): IntegrationEventHandler | undefined {
    return this.handlers.get(eventType);
  }

  listRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys()).sort();
  }
}

