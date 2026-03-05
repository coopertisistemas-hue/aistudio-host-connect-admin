import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  GUEST_LIFECYCLE_EVENT_TYPE,
  type GuestLifecycleCommand,
  type GuestLifecycleEvent,
  type GuestLifecyclePayload,
  type GuestLifecycleRequestResult,
} from "./lifecycleTypes";
import {
  InternalLifecycleAutomationAdapter,
  type LifecycleAutomationAdapter,
} from "./internalLifecycleAutomationAdapter";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isValidEmail = (email: string) => /.+@.+\..+/.test(email);
const isValidPhoneNumber = (phoneNumber: string) => /^\+[1-9]\d{7,14}$/.test(phoneNumber);

const hasValidLifecycleRecipient = (command: GuestLifecycleCommand): boolean => {
  const email = command.recipient.email;
  const phone = command.recipient.phoneNumber;
  const emailValid = email === undefined || isValidEmail(email);
  const phoneValid = phone === undefined || isValidPhoneNumber(phone);

  return emailValid && phoneValid && (email !== undefined || phone !== undefined);
};

const isLifecycleAutomationEnabled = (command: GuestLifecycleCommand): boolean => {
  const flag = command.featureFlags?.lifecycleAutomation;
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

export interface LifecycleAutomationLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: LifecycleAutomationAdapter;
}

export class LifecycleAutomationLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: LifecycleAutomationAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: LifecycleAutomationLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalLifecycleAutomationAdapter();

    this.eventBus.registerHandler({
      eventType: GUEST_LIFECYCLE_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.dispatch({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as GuestLifecyclePayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: LifecycleAutomationAdapter,
  ): LifecycleAutomationLayerDependencies & { layer: LifecycleAutomationLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new LifecycleAutomationLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async requestLifecycleDispatch(
    command: GuestLifecycleCommand,
  ): Promise<GuestLifecycleRequestResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isLifecycleAutomationEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!command.consent.automationAllowed) {
      return { accepted: false, correlationId, reason: "consent_missing" };
    }

    if (!hasValidLifecycleRecipient(command)) {
      return { accepted: false, correlationId, reason: "invalid_recipient" };
    }

    const event: GuestLifecycleEvent = {
      id: `lifecycle-${createSeed()}`,
      eventType: GUEST_LIFECYCLE_EVENT_TYPE,
      domain: "communication",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        action: command.action,
        recipient: command.recipient,
        scheduleAt: command.scheduleAt,
        variables: command.variables,
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
