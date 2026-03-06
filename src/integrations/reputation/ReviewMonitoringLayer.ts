import { reviewAdapter } from './InternalReviewAdapter';
import type {
  ReviewEvent,
  ReviewFilter,
  ReviewIngestionRequest,
  ReviewIngestionResult,
  ReviewSource,
  ReviewSentiment,
} from './types';

function generateCorrelationId(): string {
  return `review_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

function detectSentiment(content: string, rating: number): ReviewSentiment {
  if (rating >= 4) return 'positive';
  if (rating <= 2) return 'negative';
  return 'neutral';
}

function transformToReviewEvent(
  request: ReviewIngestionRequest,
  correlationId: string
): ReviewEvent {
  const payload = request.payload;
  
  return {
    id: crypto.randomUUID(),
    orgId: request.orgId,
    propertyId: request.propertyId,
    source: request.source,
    externalReviewId: request.externalReviewId,
    rating: typeof payload.rating === 'number' ? payload.rating : 0,
    maxRating: typeof payload.maxRating === 'number' ? payload.maxRating : 5,
    title: typeof payload.title === 'string' ? payload.title : undefined,
    content: typeof payload.content === 'string' ? payload.content : '',
    authorName: typeof payload.authorName === 'string' ? payload.authorName : 'Anonymous',
    authorUrl: typeof payload.authorUrl === 'string' ? payload.authorUrl : undefined,
    reviewUrl: typeof payload.reviewUrl === 'string' ? payload.reviewUrl : undefined,
    publishedAt: typeof payload.publishedAt === 'string' 
      ? payload.publishedAt 
      : new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    sentiment: detectSentiment(
      typeof payload.content === 'string' ? payload.content : '',
      typeof payload.rating === 'number' ? payload.rating : 0
    ),
    metadata: payload.metadata as Record<string, unknown> | undefined,
    correlationId,
  };
}

export class ReviewMonitoringLayer {
  private adapter: typeof reviewAdapter;

  constructor(adapter: typeof reviewAdapter = reviewAdapter) {
    this.adapter = adapter;
  }

  async ingestReview(
    request: ReviewIngestionRequest
  ): Promise<ReviewIngestionResult> {
    const correlationId = request.correlationId || generateCorrelationId();
    
    try {
      const reviewEvent = transformToReviewEvent(request, correlationId);
      
      const reviewId = await this.adapter.save(reviewEvent);
      
      console.log(`[ReviewMonitoring] Review ingested: ${reviewId}`, {
        correlationId,
        orgId: request.orgId,
        source: request.source,
      });
      
      return {
        success: true,
        reviewId,
        correlationId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error during review ingestion';
      
      console.error(`[ReviewMonitoring] Ingestion failed:`, {
        correlationId,
        error: errorMessage,
      });
      
      return {
        success: false,
        correlationId,
        error: errorMessage,
      };
    }
  }

  async getReview(
    orgId: string,
    reviewId: string,
    propertyId?: string
  ): Promise<ReviewEvent | null> {
    return this.adapter.findById(orgId, reviewId, propertyId);
  }

  async getReviews(filter: ReviewFilter): Promise<ReviewEvent[]> {
    return this.adapter.findAll(filter);
  }

  async updateSentiment(
    orgId: string,
    reviewId: string,
    sentiment: ReviewSentiment,
    propertyId?: string
  ): Promise<boolean> {
    return this.adapter.updateSentiment(orgId, reviewId, sentiment, propertyId);
  }

  async respondToReview(
    orgId: string,
    reviewId: string,
    response: { content: string; authorName: string },
    propertyId?: string
  ): Promise<boolean> {
    return this.adapter.addResponse(orgId, reviewId, response, propertyId);
  }

  async deleteReview(
    orgId: string,
    reviewId: string,
    propertyId?: string
  ): Promise<boolean> {
    return this.adapter.delete(orgId, reviewId, propertyId);
  }

  async ingestBatch(
    requests: ReviewIngestionRequest[]
  ): Promise<ReviewIngestionResult[]> {
    const results: ReviewIngestionResult[] = [];
    
    for (const request of requests) {
      const result = await this.ingestReview(request);
      results.push(result);
    }
    
    return results;
  }

  generateCorrelationId(): string {
    return generateCorrelationId();
  }
}

export const reviewMonitoring = new ReviewMonitoringLayer();
