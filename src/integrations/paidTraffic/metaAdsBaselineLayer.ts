import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalMetaAdsAdapter,
  type MetaAdsAdapter,
} from "./internalMetaAdsAdapter";
import {
  META_ADS_EVENT_TYPE,
  type MetaAdsEvent,
  type MetaAdsIngestionCommand,
  type MetaAdsIngestionPayload,
  type MetaAdsIngestionResult,
  type MetaAdsMetricsQuery,
  type MetaAdsMetricsSnapshot,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isMetaAdsBaselineEnabled = (command: MetaAdsIngestionCommand): boolean => {
  const flag = command.featureFlags?.metaAdsBaseline;
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

const hasValidMetrics = (command: MetaAdsIngestionCommand): boolean => {
  const metrics = command.metrics;
  if (!metrics.campaignId.trim()) return false;
  if (!metrics.currency.trim()) return false;
  if (Number.isNaN(new Date(metrics.occurredAt).getTime())) return false;
  if (metrics.spendAmount < 0) return false;
  if (metrics.impressions < 0) return false;
  if (metrics.clicks < 0) return false;
  if (metrics.conversions !== undefined && metrics.conversions < 0) return false;
  return true;
};

export interface MetaAdsBaselineLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: MetaAdsAdapter;
}

export class MetaAdsBaselineLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: MetaAdsAdapter;

  constructor({
    eventBus,
    outboxQueue,
    adapter,
  }: MetaAdsBaselineLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter ?? new InternalMetaAdsAdapter();

    this.eventBus.registerHandler({
      eventType: META_ADS_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.ingest({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as MetaAdsIngestionPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: MetaAdsAdapter,
  ): MetaAdsBaselineLayerDependencies & { layer: MetaAdsBaselineLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new MetaAdsBaselineLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async ingestMetrics(command: MetaAdsIngestionCommand): Promise<MetaAdsIngestionResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isMetaAdsBaselineEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidMetrics(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: MetaAdsEvent = {
      id: `meta-ads-${createSeed()}`,
      eventType: META_ADS_EVENT_TYPE,
      domain: "marketing",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        metrics: command.metrics,
        ingestedAt: new Date().toISOString(),
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

  async getMetricsSnapshot(query: MetaAdsMetricsQuery): Promise<MetaAdsMetricsSnapshot> {
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
