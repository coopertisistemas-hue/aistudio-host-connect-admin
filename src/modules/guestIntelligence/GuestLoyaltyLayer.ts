import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { InMemoryGuestLoyaltyAdapter, type GuestLoyaltyAdapter } from "./GuestLoyaltyAdapter";
import {
  GUEST_LOYALTY_SIGNAL_EVENT_TYPE,
  type GuestLoyaltyCommand,
  type GuestLoyaltyEvent,
  type GuestLoyaltyPayload,
  type GuestLoyaltyResult,
  type GuestLoyaltySnapshot,
} from "./GuestLoyaltyTypes";
import { GuestProfilePersistenceLayer } from "./GuestProfilePersistenceLayer";
import { GuestSegmentationLayer } from "./GuestSegmentationLayer";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isGuestLoyaltyEnabled = (command: GuestLoyaltyCommand): boolean => {
  const flag = command.featureFlags?.guestLoyaltySignals;
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

const signalKey = (orgId: string, canonicalGuestId: string) => `${orgId}::${canonicalGuestId}`;

export class GuestLoyaltyLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly persistenceLayer: GuestProfilePersistenceLayer;
  private readonly segmentationLayer: GuestSegmentationLayer;
  private readonly adapter: GuestLoyaltyAdapter;
  private readonly signalStore = new Map<string, Awaited<ReturnType<GuestLoyaltyAdapter["deriveSignal"]>>>();

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    persistenceLayer: GuestProfilePersistenceLayer,
    segmentationLayer: GuestSegmentationLayer,
    adapter: GuestLoyaltyAdapter = new InMemoryGuestLoyaltyAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.persistenceLayer = persistenceLayer;
    this.segmentationLayer = segmentationLayer;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: GUEST_LOYALTY_SIGNAL_EVENT_TYPE,
      handle: async (event) => {
        await this.evaluateAndStore(
          {
            tenant: { orgId: event.orgId, propertyId: event.propertyId },
            correlationId: event.correlationId,
            canonicalGuestId: (event.payload as GuestLoyaltyPayload).canonicalGuestId,
          },
          false,
        );
      },
    });
  }

  static bootstrap(
    persistenceLayer: GuestProfilePersistenceLayer,
    segmentationLayer: GuestSegmentationLayer,
    adapter?: GuestLoyaltyAdapter,
  ): {
    layer: GuestLoyaltyLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new GuestLoyaltyLayer(
      eventBus,
      outboxQueue,
      persistenceLayer,
      segmentationLayer,
      adapter,
    );

    return { layer, eventBus, outboxQueue, observability };
  }

  async evaluate(command: GuestLoyaltyCommand): Promise<GuestLoyaltyResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isGuestLoyaltyEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    const event: GuestLoyaltyEvent = {
      id: `guest-loyalty-${createSeed()}`,
      eventType: GUEST_LOYALTY_SIGNAL_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        canonicalGuestId: command.canonicalGuestId,
        evaluatedAt: new Date().toISOString(),
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

  async getSnapshot(command: { tenant: GuestLoyaltyCommand["tenant"] }): Promise<GuestLoyaltySnapshot> {
    const signals = Array.from(this.signalStore.values())
      .filter((signal) => signal.orgId === command.tenant.orgId)
      .filter((signal) => !command.tenant.propertyId || signal.propertyId === command.tenant.propertyId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      tenant: command.tenant,
      signals,
      generatedAt: new Date().toISOString(),
    };
  }

  private async evaluateAndStore(
    command: Pick<GuestLoyaltyCommand, "tenant" | "correlationId" | "canonicalGuestId">,
    allowEmpty = true,
  ): Promise<void> {
    const [profileSnapshot, segmentationSnapshot] = await Promise.all([
      this.persistenceLayer.getSnapshot({
        tenant: command.tenant,
        canonicalGuestId: command.canonicalGuestId,
      }),
      this.segmentationLayer.getSnapshot({ tenant: command.tenant }),
    ]);

    if (!allowEmpty && profileSnapshot.records.length === 0) return;

    const segmentationByGuest = new Map(
      segmentationSnapshot.signals.map((signal) => [signal.canonicalGuestId, signal]),
    );

    for (const profile of profileSnapshot.records) {
      const signal = await this.adapter.deriveSignal(
        profile,
        segmentationByGuest.get(profile.canonicalGuestId),
        command.correlationId ?? `corr-${createSeed()}`,
      );
      this.signalStore.set(signalKey(signal.orgId, signal.canonicalGuestId), signal);
    }
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
