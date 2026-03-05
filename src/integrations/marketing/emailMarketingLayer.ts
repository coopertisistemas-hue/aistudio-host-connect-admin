import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalEmailMarketingAdapter,
  type EmailMarketingAdapter,
} from "./internalEmailMarketingAdapter";
import {
  EMAIL_MARKETING_EVENT_TYPE,
  type EmailMarketingCampaignCommand,
  type EmailMarketingCampaignEvent,
  type EmailMarketingCampaignPayload,
  type EmailMarketingCampaignResult,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isValidEmail = (email: string) => /.+@.+\..+/.test(email);

const isEmailMarketingEnabled = (command: EmailMarketingCampaignCommand): boolean => {
  const flag = command.featureFlags?.emailMarketing;
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

const hasValidAudience = (command: EmailMarketingCampaignCommand): boolean => {
  if (command.audience.recipients.length === 0) return false;
  return command.audience.recipients.every((recipient) => isValidEmail(recipient));
};

export interface EmailMarketingLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: EmailMarketingAdapter;
}

export class EmailMarketingLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: EmailMarketingAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: EmailMarketingLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalEmailMarketingAdapter();

    this.eventBus.registerHandler({
      eventType: EMAIL_MARKETING_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.dispatchCampaign({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as EmailMarketingCampaignPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: EmailMarketingAdapter,
  ): EmailMarketingLayerDependencies & { layer: EmailMarketingLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new EmailMarketingLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async requestCampaign(
    command: EmailMarketingCampaignCommand,
  ): Promise<EmailMarketingCampaignResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isEmailMarketingEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!command.consent.marketingEmailAllowed) {
      return { accepted: false, correlationId, reason: "consent_missing" };
    }

    if (!hasValidAudience(command)) {
      return { accepted: false, correlationId, reason: "invalid_audience" };
    }

    const event: EmailMarketingCampaignEvent = {
      id: `marketing-${createSeed()}`,
      eventType: EMAIL_MARKETING_EVENT_TYPE,
      domain: "marketing",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        campaignType: command.campaignType,
        campaignName: command.campaignName,
        subject: command.subject,
        body: command.body,
        audience: command.audience,
        scheduleAt: command.scheduleAt,
        consent: command.consent,
      },
    };

    const outboxMessage = this.outboxQueue.enqueue(event as unknown as IntegrationEvent);
    await this.processOutboxMessage(outboxMessage);

    this.observability.addLog({
      timestamp: new Date().toISOString(),
      level: "info",
      component: "worker",
      eventType: EMAIL_MARKETING_EVENT_TYPE,
      messageId: outboxMessage.messageId,
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      status: "processed",
      message: "Email marketing campaign request processed by internal adapter.",
    });

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
