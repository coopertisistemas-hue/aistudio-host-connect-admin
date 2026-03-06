import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalGoogleAdsAdapter,
  type GoogleAdsAdapter,
} from "./internalGoogleAdsAdapter";
import {
  GOOGLE_ADS_BASELINE_EVENT_TYPE,
  type GoogleAdsBaselineCommand,
  type GoogleAdsBaselineEvent,
  type GoogleAdsBaselinePayload,
  type GoogleAdsBaselineQuery,
  type GoogleAdsBaselineResult,
  type GoogleAdsBaselineSnapshot,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isGoogleAdsBaselineEnabled = (command: GoogleAdsBaselineCommand): boolean => {
  const flag = command.featureFlags?.googleAdsBaseline;
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

const hasValidCampaign = (command: GoogleAdsBaselineCommand): boolean => {
  const campaign = command.campaign;

  if (!campaign.campaignId.trim()) return false;
  if (!campaign.campaignName.trim()) return false;
  if (!campaign.accountId.trim()) return false;
  if (!campaign.currencyCode.trim()) return false;
  if (campaign.dailyBudgetMicros <= 0) return false;
  if (Number.isNaN(new Date(campaign.startDate).getTime())) return false;

  if (campaign.endDate) {
    if (Number.isNaN(new Date(campaign.endDate).getTime())) return false;
    if (new Date(campaign.endDate).getTime() < new Date(campaign.startDate).getTime()) {
      return false;
    }
  }

  return true;
};

export interface GoogleAdsBaselineLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: GoogleAdsAdapter;
}

export class GoogleAdsBaselineLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: GoogleAdsAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: GoogleAdsBaselineLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalGoogleAdsAdapter();

    this.eventBus.registerHandler({
      eventType: GOOGLE_ADS_BASELINE_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.upsert({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as GoogleAdsBaselinePayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: GoogleAdsAdapter,
  ): GoogleAdsBaselineLayerDependencies & { layer: GoogleAdsBaselineLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new GoogleAdsBaselineLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async requestCampaignUpsert(command: GoogleAdsBaselineCommand): Promise<GoogleAdsBaselineResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isGoogleAdsBaselineEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidCampaign(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: GoogleAdsBaselineEvent = {
      id: `gads-${createSeed()}`,
      eventType: GOOGLE_ADS_BASELINE_EVENT_TYPE,
      domain: "marketing",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        campaign: command.campaign,
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

  async getSnapshot(query: GoogleAdsBaselineQuery): Promise<GoogleAdsBaselineSnapshot> {
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
