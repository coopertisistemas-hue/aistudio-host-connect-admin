import type {
  ReputationTenantContext,
  ReviewMonitoringPayload,
  ReviewMonitoringQuery,
  ReviewMonitoringRecord,
} from "./types";

export interface ReviewAdapterIngestInput {
  messageId: string;
  correlationId: string;
  tenant: ReputationTenantContext;
  payload: ReviewMonitoringPayload;
}

export interface ReviewAdapterIngestResult {
  reviewId: string;
  ingestedAt: string;
  duplicate: boolean;
}

export interface ReviewAdapter {
  ingest(input: ReviewAdapterIngestInput): Promise<ReviewAdapterIngestResult>;
  list(query: ReviewMonitoringQuery): Promise<ReviewMonitoringRecord[]>;
}

const createReviewId = (messageId: string) =>
  `review-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

const createTenantKey = (tenant: ReputationTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

export class InternalReviewAdapter implements ReviewAdapter {
  private readonly recordsByTenant = new Map<string, ReviewMonitoringRecord[]>();

  async ingest(input: ReviewAdapterIngestInput): Promise<ReviewAdapterIngestResult> {
    const tenantKey = createTenantKey(input.tenant);
    const current = this.recordsByTenant.get(tenantKey) ?? [];

    const duplicate = current.find(
      (record) =>
        record.source === input.payload.source &&
        record.externalReviewId === input.payload.externalReviewId,
    );

    if (duplicate) {
      return {
        reviewId: duplicate.reviewId,
        ingestedAt: duplicate.receivedAt,
        duplicate: true,
      };
    }

    const ingestedAt = new Date().toISOString();
    const review: ReviewMonitoringRecord = {
      reviewId: createReviewId(input.messageId),
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      source: input.payload.source,
      externalReviewId: input.payload.externalReviewId,
      rating: input.payload.rating,
      maxRating: input.payload.maxRating,
      title: input.payload.title,
      content: input.payload.content,
      authorName: input.payload.authorName,
      reviewUrl: input.payload.reviewUrl,
      publishedAt: input.payload.publishedAt,
      receivedAt: ingestedAt,
      metadata: input.payload.metadata,
    };

    current.push(review);
    this.recordsByTenant.set(tenantKey, current);

    return {
      reviewId: review.reviewId,
      ingestedAt: review.receivedAt,
      duplicate: false,
    };
  }

  async list(query: ReviewMonitoringQuery): Promise<ReviewMonitoringRecord[]> {
    const tenantKey = createTenantKey(query.tenant);
    let filtered = [...(this.recordsByTenant.get(tenantKey) ?? [])];

    if (query.source) {
      filtered = filtered.filter((record) => record.source === query.source);
    }

    if (query.fromDate) {
      const fromTime = new Date(query.fromDate).getTime();
      filtered = filtered.filter((record) => new Date(record.publishedAt).getTime() >= fromTime);
    }

    if (query.toDate) {
      const toTime = new Date(query.toDate).getTime();
      filtered = filtered.filter((record) => new Date(record.publishedAt).getTime() <= toTime);
    }

    filtered.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    if (query.limit !== undefined && query.limit >= 0) {
      return filtered.slice(0, query.limit);
    }

    return filtered;
  }
}
