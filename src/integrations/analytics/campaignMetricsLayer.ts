import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalCampaignMetricsAdapter,
  type CampaignMetricsAdapter,
} from "./internalCampaignMetricsAdapter";
import {
  CAMPAIGN_METRICS_EVENT_TYPE,
  type CampaignMetricsCommand,
  type CampaignMetricsEvent,
  type CampaignMetricsPayload,
  type CampaignMetricsQuery,
  type CampaignMetricsResult,
  type CampaignMetricsSnapshot,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isCampaignMetricsBaselineEnabled = (command: CampaignMetricsCommand): boolean => {
  const flag = command.featureFlags?.campaignMetricsBaseline;
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

const hasValidMetrics = (command: CampaignMetricsCommand): boolean => {
  const metrics = command.metrics;
  if (!metrics.campaign.trim()) return false;
  if (!metrics.source.trim()) return false;
  if (!metrics.medium.trim()) return false;
  if (Number.isNaN(new Date(metrics.periodStart).getTime())) return false;
  if (Number.isNaN(new Date(metrics.periodEnd).getTime())) return false;
  if (new Date(metrics.periodEnd).getTime() < new Date(metrics.periodStart).getTime()) {
    return false;
  }
  if (metrics.reservationCount < 0) return false;
  if (metrics.totalRevenue < 0) return false;
  if (metrics.conversionRate < 0) return false;
  return true;
};

export interface CampaignMetricsLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: CampaignMetricsAdapter;
}

export class CampaignMetricsLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: CampaignMetricsAdapter;

  constructor({
    eventBus,
    outboxQueue,
    adapter,
  }: CampaignMetricsLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter ?? new InternalCampaignMetricsAdapter();

    this.eventBus.registerHandler({
      eventType: CAMPAIGN_METRICS_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.derive({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as CampaignMetricsPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: CampaignMetricsAdapter,
  ): CampaignMetricsLayerDependencies & { layer: CampaignMetricsLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new CampaignMetricsLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async deriveCampaignMetrics(command: CampaignMetricsCommand): Promise<CampaignMetricsResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isCampaignMetricsBaselineEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidMetrics(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: CampaignMetricsEvent = {
      id: `campaign-metrics-${createSeed()}`,
      eventType: CAMPAIGN_METRICS_EVENT_TYPE,
      domain: "marketing",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        metrics: command.metrics,
        derivedAt: new Date().toISOString(),
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

  async getCampaignMetricsSnapshot(query: CampaignMetricsQuery): Promise<CampaignMetricsSnapshot> {
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
