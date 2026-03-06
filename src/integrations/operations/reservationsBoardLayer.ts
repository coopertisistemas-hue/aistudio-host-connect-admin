import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalReservationsBoardAdapter,
  type ReservationsBoardAdapter,
} from "./internalReservationsBoardAdapter";
import {
  RESERVATIONS_BOARD_EVENT_TYPE,
  type ReservationsBoardEvent,
  type ReservationsBoardIngestionCommand,
  type ReservationsBoardIngestionPayload,
  type ReservationsBoardIngestionResult,
  type ReservationsBoardQuery,
  type ReservationsBoardSnapshot,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isReservationsBoardEnabled = (
  command: ReservationsBoardIngestionCommand,
): boolean => {
  const flag = command.featureFlags?.reservationsBoard;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (
    flag.propertyId !== undefined &&
    (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)
  ) {
    return false;
  }

  return true;
};

const hasValidCard = (command: ReservationsBoardIngestionCommand): boolean => {
  const card = command.card;
  if (!card.reservationId.trim()) return false;
  if (!card.guestName.trim()) return false;
  if (Number.isNaN(new Date(card.checkInDate).getTime())) return false;
  if (Number.isNaN(new Date(card.checkOutDate).getTime())) return false;
  if (new Date(card.checkOutDate).getTime() < new Date(card.checkInDate).getTime()) return false;
  if (card.totalAmount !== undefined && card.totalAmount < 0) return false;
  return true;
};

export interface ReservationsBoardLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: ReservationsBoardAdapter;
}

export class ReservationsBoardLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: ReservationsBoardAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: ReservationsBoardLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalReservationsBoardAdapter();

    this.eventBus.registerHandler({
      eventType: RESERVATIONS_BOARD_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.ingest({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as ReservationsBoardIngestionPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: ReservationsBoardAdapter,
  ): ReservationsBoardLayerDependencies & { layer: ReservationsBoardLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new ReservationsBoardLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async ingestReservationCard(
    command: ReservationsBoardIngestionCommand,
  ): Promise<ReservationsBoardIngestionResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isReservationsBoardEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidCard(command)) {
      return { accepted: false, correlationId, reason: "invalid_card" };
    }

    const boardId = command.boardId ?? "reservations-main";
    const event: ReservationsBoardEvent = {
      id: `board-${createSeed()}`,
      eventType: RESERVATIONS_BOARD_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        boardId,
        card: command.card,
        ingestedAt: new Date().toISOString(),
      },
    };

    const outboxMessage = this.outboxQueue.enqueue(event as unknown as IntegrationEvent);
    await this.processOutboxMessage(outboxMessage);

    return {
      accepted: true,
      messageId: outboxMessage.messageId,
      correlationId,
    };
  }

  async getBoardSnapshot(query: ReservationsBoardQuery): Promise<ReservationsBoardSnapshot> {
    return this.adapter.snapshot(query);
  }

  async retryDueMessages(now = new Date()): Promise<number> {
    const dueMessages = this.outboxQueue
      .listMessages()
      .filter(
        (message) =>
          message.status === "failed" &&
          message.nextAttemptAt !== undefined &&
          new Date(message.nextAttemptAt).getTime() <= now.getTime(),
      );

    for (const message of dueMessages) {
      await this.processOutboxMessage(message);
    }

    return dueMessages.length;
  }

  private async processOutboxMessage(message: OutboxMessage): Promise<void> {
    this.outboxQueue.markProcessing(message.messageId);
    const active = this.findOutboxMessage(message.messageId);
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

  private findOutboxMessage(messageId: string): OutboxMessage | undefined {
    return this.outboxQueue.listMessages().find((message) => message.messageId === messageId);
  }
}
