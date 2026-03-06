import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalWhatsAppMarketingAdapter,
  type WhatsAppMarketingAdapter,
} from "./internalWhatsAppMarketingAdapter";
import {
  WHATSAPP_MARKETING_EVENT_TYPE,
  type WhatsAppMarketingCampaignCommand,
  type WhatsAppMarketingCampaignEvent,
  type WhatsAppMarketingCampaignPayload,
  type WhatsAppMarketingCampaignResult,
} from "./whatsappCampaignTypes";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isValidPhoneNumber = (phoneNumber: string) => /^\+[1-9]\d{7,14}$/.test(phoneNumber);

const isWhatsAppMarketingEnabled = (command: WhatsAppMarketingCampaignCommand): boolean => {
  const flag = command.featureFlags?.whatsAppMarketing;
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

const hasValidAudience = (command: WhatsAppMarketingCampaignCommand): boolean => {
  if (command.audience.recipients.length === 0) return false;
  return command.audience.recipients.every((recipient) => isValidPhoneNumber(recipient));
};

export interface WhatsAppMarketingLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: WhatsAppMarketingAdapter;
}

export class WhatsAppMarketingLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: WhatsAppMarketingAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: WhatsAppMarketingLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalWhatsAppMarketingAdapter();

    this.eventBus.registerHandler({
      eventType: WHATSAPP_MARKETING_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.dispatchCampaign({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as WhatsAppMarketingCampaignPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: WhatsAppMarketingAdapter,
  ): WhatsAppMarketingLayerDependencies & { layer: WhatsAppMarketingLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new WhatsAppMarketingLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async requestCampaign(
    command: WhatsAppMarketingCampaignCommand,
  ): Promise<WhatsAppMarketingCampaignResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isWhatsAppMarketingEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!command.consent.marketingWhatsAppAllowed) {
      return { accepted: false, correlationId, reason: "consent_missing" };
    }

    if (!hasValidAudience(command)) {
      return { accepted: false, correlationId, reason: "invalid_audience" };
    }

    const event: WhatsAppMarketingCampaignEvent = {
      id: `whatsapp-marketing-${createSeed()}`,
      eventType: WHATSAPP_MARKETING_EVENT_TYPE,
      domain: "marketing",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        campaignType: command.campaignType,
        campaignName: command.campaignName,
        messageBody: command.messageBody,
        audience: command.audience,
        scheduleAt: command.scheduleAt,
        consent: command.consent,
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
