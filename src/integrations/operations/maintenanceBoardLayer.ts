import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalMaintenanceBoardAdapter,
  type MaintenanceBoardAdapter,
} from "./internalMaintenanceBoardAdapter";
import {
  MAINTENANCE_BOARD_EVENT_TYPE,
  type MaintenanceBoardEvent,
  type MaintenanceBoardIngestionCommand,
  type MaintenanceBoardIngestionPayload,
  type MaintenanceBoardIngestionResult,
  type MaintenanceBoardQuery,
  type MaintenanceBoardSnapshot,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isMaintenanceBoardEnabled = (
  command: MaintenanceBoardIngestionCommand,
): boolean => {
  const flag = command.featureFlags?.maintenanceBoard;
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

const hasValidTask = (command: MaintenanceBoardIngestionCommand): boolean => {
  const task = command.task;
  if (!task.taskId.trim()) return false;
  if (!task.assetId.trim()) return false;
  if (!task.title.trim()) return false;

  if (task.dueAt && Number.isNaN(new Date(task.dueAt).getTime())) {
    return false;
  }

  return true;
};

export interface MaintenanceBoardLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: MaintenanceBoardAdapter;
}

export class MaintenanceBoardLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: MaintenanceBoardAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: MaintenanceBoardLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalMaintenanceBoardAdapter();

    this.eventBus.registerHandler({
      eventType: MAINTENANCE_BOARD_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.ingest({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as MaintenanceBoardIngestionPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: MaintenanceBoardAdapter,
  ): MaintenanceBoardLayerDependencies & { layer: MaintenanceBoardLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new MaintenanceBoardLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async ingestTask(
    command: MaintenanceBoardIngestionCommand,
  ): Promise<MaintenanceBoardIngestionResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isMaintenanceBoardEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidTask(command)) {
      return { accepted: false, correlationId, reason: "invalid_task" };
    }

    const boardId = command.boardId ?? "maintenance-main";
    const event: MaintenanceBoardEvent = {
      id: `board-${createSeed()}`,
      eventType: MAINTENANCE_BOARD_EVENT_TYPE,
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

  async getBoardSnapshot(query: MaintenanceBoardQuery): Promise<MaintenanceBoardSnapshot> {
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
