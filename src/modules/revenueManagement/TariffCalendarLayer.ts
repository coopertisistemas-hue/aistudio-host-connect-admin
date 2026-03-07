import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { InMemoryTariffCalendarAdapter, type TariffCalendarAdapter } from "./TariffCalendarAdapter";
import {
  TARIFF_CALENDAR_EVENT_TYPE,
  type TariffCalendarCommand,
  type TariffCalendarEvent,
  type TariffCalendarPayload,
  type TariffCalendarQuery,
  type TariffCalendarResult,
  type TariffCalendarSnapshot,
} from "./TariffCalendarTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: TariffCalendarCommand): boolean => {
  const flag = command.featureFlags?.tariffCalendarBaseline;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const hasValidEntries = (command: TariffCalendarCommand): boolean => {
  if (command.entries.length === 0) return false;
  return command.entries.every((entry) => {
    const isDateValid = !Number.isNaN(new Date(entry.date).getTime());
    const isBaseRateValid = Number.isFinite(entry.baseRate) && entry.baseRate >= 0;
    const isMinStayValid = entry.minStayNights === undefined || entry.minStayNights >= 1;
    const isMaxStayValid = entry.maxStayNights === undefined || entry.maxStayNights >= 1;
    const isBoundsValid =
      entry.minStayNights === undefined
      || entry.maxStayNights === undefined
      || entry.maxStayNights >= entry.minStayNights;

    return isDateValid && isBaseRateValid && isMinStayValid && isMaxStayValid && isBoundsValid;
  });
};

export class TariffCalendarLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: TariffCalendarAdapter;

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    adapter: TariffCalendarAdapter = new InMemoryTariffCalendarAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: TARIFF_CALENDAR_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.upsert({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as TariffCalendarPayload,
        });
      },
    });
  }

  static bootstrap(adapter?: TariffCalendarAdapter): {
    layer: TariffCalendarLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new TariffCalendarLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async upsertCalendar(command: TariffCalendarCommand): Promise<TariffCalendarResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidEntries(command)) {
      return { accepted: false, correlationId, reason: "invalid_entries" };
    }

    const event: TariffCalendarEvent = {
      id: `tariff-calendar-${createSeed()}`,
      eventType: TARIFF_CALENDAR_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        entries: command.entries,
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

  async getCalendar(query: TariffCalendarQuery): Promise<TariffCalendarSnapshot> {
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

      this.outboxQueue.markFailure(
        active.messageId,
        `publish_${publishResult.reason ?? "rejected"}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown_error";
      this.outboxQueue.markFailure(active.messageId, errorMessage);
    }
  }
}
