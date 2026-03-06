import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalHousekeepingBoardAdapter,
  type HousekeepingBoardAdapter,
} from "./internalHousekeepingBoardAdapter";
import {
  HOUSEKEEPING_BOARD_EVENT_TYPE,
  type HousekeepingBoardEvent,
  type HousekeepingBoardIngestionCommand,
  type HousekeepingBoardIngestionPayload,
  type HousekeepingBoardIngestionResult,
  type HousekeepingBoardQuery,
  type HousekeepingBoardSnapshot,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isHousekeepingBoardEnabled = (
  command: HousekeepingBoardIngestionCommand,
): boolean => {
  const flag = command.featureFlags?.housekeepingBoard;
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

const hasValidTask = (command: HousekeepingBoardIngestionCommand): boolean => {
  const task = command.task;
  if (!task.taskId.trim()) return false;
  if (!task.roomId.trim()) return false;

  if (task.dueAt && Number.isNaN(new Date(task.dueAt).getTime())) {
    return false;
  }

  return true;
};

export interface HousekeepingBoardLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: HousekeepingBoardAdapter;
}

export class HousekeepingBoardLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: HousekeepingBoardAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: HousekeepingBoardLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalHousekeepingBoardAdapter();

    this.eventBus.registerHandler({
      eventType: HOUSEKEEPING_BOARD_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.ingest({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as HousekeepingBoardIngestionPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: HousekeepingBoardAdapter,
  ): HousekeepingBoardLayerDependencies & { layer: HousekeepingBoardLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new HousekeepingBoardLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async ingestTask(
    command: HousekeepingBoardIngestionCommand,
  ): Promise<HousekeepingBoardIngestionResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isHousekeepingBoardEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidTask(command)) {
      return { accepted: false, correlationId, reason: "invalid_task" };
    }

    const boardId = command.boardId ?? "housekeeping-main";
    const event: HousekeepingBoardEvent = {
      id: `board-${createSeed()}`,
      eventType: HOUSEKEEPING_BOARD_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        boardId,
        task: command.task,
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

  async getBoardSnapshot(query: HousekeepingBoardQuery): Promise<HousekeepingBoardSnapshot> {
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
