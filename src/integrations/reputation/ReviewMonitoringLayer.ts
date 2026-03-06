import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "../hub";
import {
  InternalReviewAdapter,
  type ReviewAdapter,
} from "./internalReviewAdapter";
import {
  REVIEW_MONITORING_EVENT_TYPE,
  type ReviewMonitoringCommand,
  type ReviewMonitoringEvent,
  type ReviewMonitoringPayload,
  type ReviewMonitoringQuery,
  type ReviewMonitoringRecord,
  type ReviewMonitoringResult,
} from "./types";

const createSeed = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const isReviewMonitoringEnabled = (command: ReviewMonitoringCommand): boolean => {
  const flag = command.featureFlags?.reviewMonitoring;
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

const hasValidReview = (command: ReviewMonitoringCommand): boolean => {
  const rating = command.review.rating;
  const maxRating = command.review.maxRating;

  if (!Number.isFinite(rating) || !Number.isFinite(maxRating)) return false;
  if (maxRating <= 0 || rating <= 0 || rating > maxRating) return false;
  if (!command.review.externalReviewId.trim()) return false;
  if (!command.review.authorName.trim()) return false;
  if (!command.review.content.trim()) return false;
  if (Number.isNaN(new Date(command.review.publishedAt).getTime())) return false;

  return true;
};

export interface ReviewMonitoringLayerDependencies {
  eventBus: EventBus;
  outboxQueue: OutboxQueue;
  observability: IntegrationObservability;
  adapter?: ReviewAdapter;
}

export class ReviewMonitoringLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly observability: IntegrationObservability;
  private readonly adapter: ReviewAdapter;

  constructor({
    eventBus,
    outboxQueue,
    observability,
    adapter,
  }: ReviewMonitoringLayerDependencies) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.observability = observability;
    this.adapter = adapter ?? new InternalReviewAdapter();

    this.eventBus.registerHandler({
      eventType: REVIEW_MONITORING_EVENT_TYPE,
      handle: async (event) => {
        await this.adapter.ingest({
          messageId: `${event.id}:${event.eventType}`,
          correlationId: event.correlationId,
          tenant: {
            orgId: event.orgId,
            propertyId: event.propertyId,
          },
          payload: event.payload as unknown as ReviewMonitoringPayload,
        });
      },
    });
  }

  static bootstrap(
    adapter?: ReviewAdapter,
  ): ReviewMonitoringLayerDependencies & { layer: ReviewMonitoringLayer } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new ReviewMonitoringLayer({
      eventBus,
      outboxQueue,
      observability,
      adapter,
    });

    return { eventBus, outboxQueue, observability, layer };
  }

  async ingestReview(command: ReviewMonitoringCommand): Promise<ReviewMonitoringResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isReviewMonitoringEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!hasValidReview(command)) {
      return { accepted: false, correlationId, reason: "invalid_review" };
    }

    const event: ReviewMonitoringEvent = {
      id: `review-${createSeed()}`,
      eventType: REVIEW_MONITORING_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        source: command.source,
        externalReviewId: command.review.externalReviewId,
        rating: command.review.rating,
        maxRating: command.review.maxRating,
        title: command.review.title,
        content: command.review.content,
        authorName: command.review.authorName,
        reviewUrl: command.review.reviewUrl,
        publishedAt: command.review.publishedAt,
        receivedAt: new Date().toISOString(),
        metadata: command.review.metadata,
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

  async listReviews(query: ReviewMonitoringQuery): Promise<ReviewMonitoringRecord[]> {
    return this.adapter.list(query);
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
