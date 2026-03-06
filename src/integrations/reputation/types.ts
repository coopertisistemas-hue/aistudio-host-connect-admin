export interface ReviewEvent {
  id: string;
  orgId: string;
  propertyId?: string;
  source: ReviewSource;
  externalReviewId: string;
  rating: number;
  maxRating: number;
  title?: string;
  content: string;
  authorName: string;
  authorUrl?: string;
  reviewUrl?: string;
  publishedAt: string;
  receivedAt: string;
  sentiment?: ReviewSentiment;
  response?: ReviewResponse;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

export type ReviewSource = 'google' | 'tripadvisor' | 'booking' | 'internal';

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export interface ReviewResponse {
  content: string;
  authorName: string;
  respondedAt: string;
}

export interface ReviewFilter {
  orgId: string;
  propertyId?: string;
  source?: ReviewSource;
  sentiment?: ReviewSentiment;
  minRating?: number;
  maxRating?: number;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

export interface ReputationMetrics {
  orgId: string;
  propertyId?: string;
  period: MetricsPeriod;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
  sentimentDistribution: Record<ReviewSentiment, number>;
  responseRate: number;
  trendDirection?: 'improving' | 'stable' | 'declining';
  generatedAt: string;
}

export type MetricsPeriod = '7d' | '30d' | '90d' | '1y';

export interface ReviewIngestionRequest {
  orgId: string;
  propertyId?: string;
  source: ReviewSource;
  externalReviewId: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}

export interface ReviewIngestionResult {
  success: boolean;
  reviewId?: string;
  correlationId: string;
  error?: string;
}
