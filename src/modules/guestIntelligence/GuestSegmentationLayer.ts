import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import {
  InMemoryGuestSegmentationAdapter,
  type GuestSegmentationAdapter,
} from "./GuestSegmentationAdapter";
import { GuestProfilePersistenceLayer } from "./GuestProfilePersistenceLayer";
import {
  GUEST_SEGMENTATION_EVENT_TYPE,
  type GuestSegmentationCommand,
  type GuestSegmentationEvent,
  type GuestSegmentationPayload,
  type GuestSegmentationResult,
  type GuestSegmentationSnapshot,
} from "./GuestSegmentationTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isGuestSegmentationEnabled = (command: GuestSegmentationCommand): boolean => {
  const flag = command.featureFlags?.guestSegmentation;
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

export class GuestSegmentationLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly persistenceLayer: GuestProfilePersistenceLayer;
  private readonly adapter: GuestSegmentationAdapter;
  private readonly signalStore = new Map<string, Awaited<ReturnType<GuestSegmentationAdapter["deriveSignal"]>>>();

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    persistenceLayer: GuestProfilePersistenceLayer,
    adapter: GuestSegmentationAdapter = new InMemoryGuestSegmentationAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.persistenceLayer = persistenceLayer;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: GUEST_SEGMENTATION_EVENT_TYPE,
      handle: async (event) => {
        await this.evaluateAndStore(
          {
            tenant: {
              orgId: event.orgId,
              propertyId: event.propertyId,
            },
            correlationId: event.correlationId,
            canonicalGuestId: (event.payload as GuestSegmentationPayload).canonicalGuestId,
          },
          false,
        );
      },
    });
  }

  static bootstrap(
    persistenceLayer: GuestProfilePersistenceLayer,
    adapter?: GuestSegmentationAdapter,
  ): {
    layer: GuestSegmentationLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new GuestSegmentationLayer(
      eventBus,
      outboxQueue,
      persistenceLayer,
      adapter,
    );

    return { layer, eventBus, outboxQueue, observability };
  }

  async evaluate(command: GuestSegmentationCommand): Promise<GuestSegmentationResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isGuestSegmentationEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    const event: GuestSegmentationEvent = {
      id: `guest-segmentation-${createSeed()}`,
      eventType: GUEST_SEGMENTATION_EVENT_TYPE,
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

  async getSnapshot(command: { tenant: GuestSegmentationCommand["tenant"] }): Promise<GuestSegmentationSnapshot> {
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
    command: Pick<GuestSegmentationCommand, "tenant" | "correlationId" | "canonicalGuestId">,
    allowEmpty = true,
  ): Promise<void> {
    const snapshot = await this.persistenceLayer.getSnapshot({
      tenant: command.tenant,
      canonicalGuestId: command.canonicalGuestId,
    });

    if (!allowEmpty && snapshot.records.length === 0) return;

    for (const record of snapshot.records) {
      const signal = await this.adapter.deriveSignal(record, command.correlationId ?? `corr-${createSeed()}`);
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
