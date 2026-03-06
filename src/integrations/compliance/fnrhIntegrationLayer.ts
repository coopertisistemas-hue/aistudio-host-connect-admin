import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalFnrhAdapter,
  type FnrhAdapter,
} from "./internalFnrhAdapter";
import {
  FNRH_INTEGRATION_EVENT_TYPE,
  type FnrhIntegrationCommand,
  type FnrhIntegrationEvent,
  type FnrhIntegrationResult,
  type FnrhMonitoringSnapshot,
  type FnrhTenantContext,
  type FnrhSubmissionPayload,
  type FnrhSubmissionQuery,
  type FnrhPreparedSubmissionRecord,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isFnrhIntegrationEnabled = (command: FnrhIntegrationCommand): boolean => {
  const flag = command.featureFlags?.fnrhIntegration;
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

const hasValidSubmissionShape = (command: FnrhIntegrationCommand): boolean => {
  if (!command.reservation.reservationId.trim()) return false;
  if (!command.guest.fullName.trim()) return false;
  if (!command.guest.document.number.trim()) return false;
  if (!command.reservation.checkInDate.trim()) return false;
  if (!command.reservation.checkOutDate.trim()) return false;
  return true;
};

export interface FnrhIntegrationLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: FnrhAdapter;
}

export class FnrhIntegrationLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: FnrhAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: FnrhIntegrationLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalFnrhAdapter();

    this.eventBus.registerHandler({
      eventType: FNRH_INTEGRATION_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.prepare({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as FnrhSubmissionPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: FnrhAdapter,
  ): FnrhIntegrationLayerDependencies & { layer: FnrhIntegrationLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new FnrhIntegrationLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async requestSubmission(command: FnrhIntegrationCommand): Promise<FnrhIntegrationResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFnrhIntegrationEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidSubmissionShape(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: FnrhIntegrationEvent = {
      id: `fnrh-${createSeed()}`,
      eventType: FNRH_INTEGRATION_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        lifecycleStage: command.lifecycleStage,
        reservation: command.reservation,
        property: command.property,
        guest: command.guest,
        requestedAt: new Date().toISOString(),
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

  async listPreparedSubmissions(
    query: FnrhSubmissionQuery,
  ): Promise<FnrhPreparedSubmissionRecord[]> {
    return this.adapter.listPreparedSubmissions(query);
  }

  async getMonitoringSnapshot(tenant: FnrhTenantContext): Promise<FnrhMonitoringSnapshot> {
    const base = await this.adapter.getMonitoringSnapshot(tenant);

    const tenantMessages = this.outboxQueue
      .listMessages()
      .filter(
        (message) =>
          message.event.orgId === tenant.orgId &&
          (message.event.propertyId ?? null) === (tenant.propertyId ?? null),
      );

    return {
      ...base,
      totals: {
        ...base.totals,
        processing: tenantMessages.filter((message) => message.status === "processing").length,
        failed: tenantMessages.filter((message) => message.status === "failed").length,
        deadLetter: tenantMessages.filter((message) => message.status === "dead_letter").length,
      },
      generatedAt: new Date().toISOString(),
    };
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
    const activeMessage = this.findOutboxMessage(message.messageId);
    if (!activeMessage) return;

    try {
      const publishResult = await this.eventBus.publish(activeMessage.event);
      if (publishResult.accepted) {
        this.outboxQueue.markSuccess(activeMessage.messageId);
        return;
      }

      this.outboxQueue.markFailure(
        activeMessage.messageId,
        `publish_${publishResult.reason ?? "rejected"}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown_error";
      this.outboxQueue.markFailure(activeMessage.messageId, errorMessage);
    }
  }

  private findOutboxMessage(messageId: string): OutboxMessage | undefined {
    return this.outboxQueue.listMessages().find((message) => message.messageId === messageId);
  }
}
