import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalLeadCaptureAdapter,
  type LeadCaptureAdapter,
} from "./internalLeadCaptureAdapter";
import {
  LEAD_CAPTURE_EVENT_TYPE,
  type LeadCaptureCommand,
  type LeadCaptureEvent,
  type LeadCapturePayload,
  type LeadCaptureRequestResult,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isValidEmail = (email: string) => /.+@.+\..+/.test(email);
const isValidPhoneNumber = (phoneNumber: string) => /^\+[1-9]\d{7,14}$/.test(phoneNumber);

const hasValidContact = (command: LeadCaptureCommand): boolean => {
  const hasValidEmail =
    command.contact.email !== undefined && isValidEmail(command.contact.email);
  const hasValidPhone =
    command.contact.phoneNumber !== undefined &&
    isValidPhoneNumber(command.contact.phoneNumber);

  return hasValidEmail || hasValidPhone;
};

const isLeadCaptureEnabled = (command: LeadCaptureCommand): boolean => {
  const flag = command.featureFlags?.leadCapture;
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

export interface LeadCaptureLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: LeadCaptureAdapter;
}

export class LeadCaptureLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: LeadCaptureAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: LeadCaptureLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalLeadCaptureAdapter();

    this.eventBus.registerHandler({
      eventType: LEAD_CAPTURE_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.capture({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as LeadCapturePayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: LeadCaptureAdapter,
  ): LeadCaptureLayerDependencies & { layer: LeadCaptureLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new LeadCaptureLayer({
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

  async requestLeadCapture(command: LeadCaptureCommand): Promise<LeadCaptureRequestResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isLeadCaptureEnabled(command)) {
      return {
        accepted: false,
        correlationId,
        reason: "feature_disabled",
      };
    }

    if (!command.consent.contactAllowed) {
      return {
        accepted: false,
        correlationId,
        reason: "consent_missing",
      };
    }

    if (!hasValidContact(command)) {
      return {
        accepted: false,
        correlationId,
        reason: "invalid_contact",
      };
    }

    const event: LeadCaptureEvent = {
      id: `lead-${createSeed()}`,
      eventType: LEAD_CAPTURE_EVENT_TYPE,
      domain: "communication",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        source: command.source,
        contact: command.contact,
        notes: command.notes,
        metadata: command.metadata,
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
      eventType: LEAD_CAPTURE_EVENT_TYPE,
      messageId: outboxMessage.messageId,
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      status: finalState?.status ?? "pending",
      retryCount: finalState?.attempt,
      message:
        finalState?.status === "succeeded"
          ? "Lead capture request processed by internal adapter."
          : "Lead capture request queued with retry policy after processing failure.",
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
