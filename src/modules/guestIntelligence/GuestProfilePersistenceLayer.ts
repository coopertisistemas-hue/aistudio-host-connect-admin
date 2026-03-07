import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import {
  InMemoryGuestProfilePersistenceAdapter,
  type GuestProfilePersistenceAdapter,
} from "./GuestProfilePersistenceAdapter";
import {
  GUEST_PROFILE_PERSISTENCE_EVENT_TYPE,
  type GuestProfilePersistenceCommand,
  type GuestProfilePersistenceEvent,
  type GuestProfilePersistencePayload,
  type GuestProfilePersistenceResult,
  type GuestProfileQuery,
  type GuestProfileSnapshot,
} from "./GuestProfileTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isGuestProfilePersistenceEnabled = (
  command: GuestProfilePersistenceCommand,
): boolean => {
  const flag = command.featureFlags?.guestProfilePersistence;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (
    flag.propertyId !== undefined
    && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)
  ) {
    return false;
  }

  return true;
};

const hasIdentityInput = (command: GuestProfilePersistenceCommand): boolean => {
  const identity = command.identity;
  const contact = command.snapshot.contact;
  return Boolean(
    identity.externalGuestId
      || identity.leadId
      || identity.reservationId
      || identity.lifecycleEventId
      || contact.email
      || contact.phoneNumber,
  );
};

export class GuestProfilePersistenceLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: GuestProfilePersistenceAdapter;

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    adapter: GuestProfilePersistenceAdapter = new InMemoryGuestProfilePersistenceAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: GUEST_PROFILE_PERSISTENCE_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.persistProfile({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as GuestProfilePersistencePayload,
        });
      },
    });
  }

  static bootstrap(adapter?: GuestProfilePersistenceAdapter): {
    layer: GuestProfilePersistenceLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new GuestProfilePersistenceLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async persistProfile(
    command: GuestProfilePersistenceCommand,
  ): Promise<GuestProfilePersistenceResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isGuestProfilePersistenceEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasIdentityInput(command)) {
      return { accepted: false, correlationId, reason: "invalid_identity" };
    }

    const event: GuestProfilePersistenceEvent = {
      id: `guest-profile-${createSeed()}`,
      eventType: GUEST_PROFILE_PERSISTENCE_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        source: command.source,
        identity: command.identity,
        snapshot: command.snapshot,
        capturedAt: new Date().toISOString(),
      },
    };

    const message = this.outboxQueue.enqueue(event as unknown as IntegrationEvent);
    await this.processOutboxMessage(message);

    return {
      accepted: true,
      correlationId,
      messageId: message.messageId,
    };
  }

  async getSnapshot(query: GuestProfileQuery): Promise<GuestProfileSnapshot> {
    return this.adapter.snapshot(query);
  }

  async retryDueMessages(now = new Date()): Promise<number> {
    const dueMessages = this.outboxQueue
      .listMessages()
      .filter(
        (message) =>
          message.status === "failed"
          && message.nextAttemptAt !== undefined
          && new Date(message.nextAttemptAt).getTime() <= now.getTime(),
      );

    for (const message of dueMessages) {
      await this.processOutboxMessage(message);
    }

    return dueMessages.length;
  }

  private async processOutboxMessage(message: OutboxMessage): Promise<void> {
    this.outboxQueue.markProcessing(message.messageId);
    const activeMessage = this.outboxQueue
      .listMessages()
      .find((queuedMessage) => queuedMessage.messageId === message.messageId);

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
}
