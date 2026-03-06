import type { IntegrationEvent } from "../hub";

export const REVIEW_MONITORING_EVENT_TYPE =
  "reputation.review.monitoring.ingest.requested";

export type ReviewSource =
  | "google_reviews"
  | "google_business_profile"
  | "internal";

export type ReviewSentiment = "positive" | "neutral" | "negative" | "unknown";

export interface ReputationTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface ReviewMonitoringCommand {
  tenant: ReputationTenantContext;
  correlationId?: string;
  source: ReviewSource;
  review: {
    externalReviewId: string;
    rating: number;
    maxRating: number;
    title?: string;
    content: string;
    authorName: string;
    reviewUrl?: string;
    publishedAt: string;
    metadata?: Record<string, unknown>;
  };
  featureFlags?: {
    reviewMonitoring?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface ReviewMonitoringPayload {
  source: ReviewSource;
  externalReviewId: string;
  rating: number;
  maxRating: number;
  title?: string;
  content: string;
  authorName: string;
  reviewUrl?: string;
  publishedAt: string;
  receivedAt: string;
  metadata?: Record<string, unknown>;
}

export type ReviewMonitoringEvent = IntegrationEvent<ReviewMonitoringPayload>;

export interface ReviewMonitoringResult {
  accepted: boolean;
  messageId?: string;
  correlationId: string;
  reason?: "feature_disabled" | "invalid_review";
}

export interface ReviewMonitoringRecord {
  reviewId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  source: ReviewSource;
  externalReviewId: string;
  rating: number;
  maxRating: number;
  title?: string;
  content: string;
  authorName: string;
  reviewUrl?: string;
  publishedAt: string;
  receivedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ReviewMonitoringQuery {
  tenant: ReputationTenantContext;
  source?: ReviewSource;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}

export interface ReputationAnalyticsCommand {
  tenant: ReputationTenantContext;
  correlationId?: string;
  range?: {
    fromDate?: string;
    toDate?: string;
  };
  featureFlags?: {
    reputationAnalytics?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export type ReputationTrendDirection = "improving" | "stable" | "declining";

export interface ReputationAnalyticsSnapshot {
  totalReviews: number;
  averageRating: number;
  ratingAggregation: Record<1 | 2 | 3 | 4 | 5, number>;
  trendDirection: ReputationTrendDirection;
  sentimentPlaceholder: Record<ReviewSentiment, number>;
  reputationScore: number;
  generatedAt: string;
}

export interface ReputationAnalyticsResult {
  accepted: boolean;
  correlationId: string;
  snapshot?: ReputationAnalyticsSnapshot;
  reason?: "feature_disabled";
}
