import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  CAMPAIGN_ANALYTICS_EVENT_TYPE,
  type CampaignAnalyticsCommand,
  type CampaignAnalyticsEvent,
  type CampaignAnalyticsPayload,
  type CampaignAnalyticsResult,
} from "./campaignAnalyticsTypes";
import {
  InternalCampaignAnalyticsAdapter,
  type CampaignAnalyticsAdapter,
} from "./internalCampaignAnalyticsAdapter";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isCampaignAnalyticsEnabled = (command: CampaignAnalyticsCommand): boolean => {
  const flag = command.featureFlags?.campaignAnalytics;
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

const hasValidMetrics = (command: CampaignAnalyticsCommand): boolean => {
  const { sent, delivered, opened, clicked, converted } = command.metrics;
  const values = [sent, delivered, opened, clicked, converted];
  if (values.some((value) => value < 0)) return false;
  if (delivered > sent) return false;
  if (opened > delivered) return false;
  if (clicked > opened) return false;
  if (converted > clicked) return false;
  return true;
};

export interface CampaignAnalyticsLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: CampaignAnalyticsAdapter;
}

export class CampaignAnalyticsLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: CampaignAnalyticsAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: CampaignAnalyticsLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalCampaignAnalyticsAdapter();

    this.eventBus.registerHandler({
      eventType: CAMPAIGN_ANALYTICS_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.record({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as CampaignAnalyticsPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: CampaignAnalyticsAdapter,
  ): CampaignAnalyticsLayerDependencies & { layer: CampaignAnalyticsLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new CampaignAnalyticsLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async requestAnalytics(
    command: CampaignAnalyticsCommand,
  ): Promise<CampaignAnalyticsResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isCampaignAnalyticsEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidMetrics(command)) {
      return { accepted: false, correlationId, reason: "invalid_metrics" };
    }

    const event: CampaignAnalyticsEvent = {
      id: `analytics-${createSeed()}`,
      eventType: CAMPAIGN_ANALYTICS_EVENT_TYPE,
      domain: "marketing",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        channel: command.channel,
        campaignName: command.campaignName,
        metrics: command.metrics,
        capturedAt: command.capturedAt ?? new Date().toISOString(),
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
