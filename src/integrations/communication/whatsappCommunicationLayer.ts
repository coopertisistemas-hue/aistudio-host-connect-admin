import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalTransactionalWhatsAppAdapter,
  type TransactionalWhatsAppAdapter,
} from "./internalTransactionalWhatsAppAdapter";
import {
  TRANSACTIONAL_WHATSAPP_EVENT_TYPE,
  type TransactionalWhatsAppCommand,
  type TransactionalWhatsAppEvent,
  type TransactionalWhatsAppPayload,
  type TransactionalWhatsAppRequestResult,
} from "./whatsappTypes";

const createMessageSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isValidPhoneNumber = (phoneNumber: string) => /^\+[1-9]\d{7,14}$/.test(phoneNumber);

const isTransactionalWhatsAppEnabled = (command: TransactionalWhatsAppCommand): boolean => {
  const flag = command.featureFlags?.transactionalWhatsApp;
  if (!flag) {
    return true;
  }

  if (!flag.enabled) {
    return false;
  }

  if (flag.orgId && flag.orgId !== command.tenant.orgId) {
    return false;
  }

  if (
    flag.propertyId !== undefined &&
    (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)
  ) {
    return false;
  }

  return true;
};

export interface WhatsAppCommunicationLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: TransactionalWhatsAppAdapter;
}

export class WhatsAppCommunicationLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: TransactionalWhatsAppAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: WhatsAppCommunicationLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalTransactionalWhatsAppAdapter();

    this.eventBus.registerHandler({
      eventType: TRANSACTIONAL_WHATSAPP_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.send({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as TransactionalWhatsAppPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: TransactionalWhatsAppAdapter,
  ): WhatsAppCommunicationLayerDependencies & { layer: WhatsAppCommunicationLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new WhatsAppCommunicationLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return {
      eventBus,
      outboxQueue,
      observability,
      layer,
    };
  }

  async requestTransactionalMessage(
    command: TransactionalWhatsAppCommand,
  ): Promise<TransactionalWhatsAppRequestResult> {
    const correlationId = command.correlationId ?? `corr-${createMessageSeed()}`;

    if (!isTransactionalWhatsAppEnabled(command)) {
      return {
        accepted: false,
        correlationId,
        reason: "feature_disabled",
      };
    }

    if (!command.consent.transactionalWhatsAppAllowed) {
      return {
        accepted: false,
        correlationId,
        reason: "consent_missing",
      };
    }

    if (!isValidPhoneNumber(command.recipient.phoneNumber)) {
      return {
        accepted: false,
        correlationId,
        reason: "invalid_recipient",
      };
    }

    const eventId = `whatsapp-${createMessageSeed()}`;
    const event: TransactionalWhatsAppEvent = {
      id: eventId,
      eventType: TRANSACTIONAL_WHATSAPP_EVENT_TYPE,
      domain: "communication",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        template: command.template,
        recipient: command.recipient,
        messageBody: command.messageBody,
        variables: command.variables,
        consent: command.consent,
      },
    };

    const outboxMessage = this.outboxQueue.enqueue(event as unknown as IntegrationEvent);
    await this.processOutboxMessage(outboxMessage);

    const finalState = this.findOutboxMessage(outboxMessage.messageId);
    this.observability.addLog({
      timestamp: new Date().toISOString(),
      level: finalState?.status === "succeeded" ? "info" : "warn",
      component: "worker",
      eventType: TRANSACTIONAL_WHATSAPP_EVENT_TYPE,
      messageId: outboxMessage.messageId,
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      status: finalState?.status ?? "pending",
      retryCount: finalState?.attempt,
      message:
        finalState?.status === "succeeded"
          ? "Transactional WhatsApp message dispatched through internal adapter."
          : "Transactional WhatsApp message queued with retry policy after dispatch failure.",
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
    if (!activeMessage) {
      return;
    }

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
