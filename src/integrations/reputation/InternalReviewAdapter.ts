import type {
  ReviewEvent,
  ReviewFilter,
  ReviewSource,
  ReviewSentiment,
} from './types';

const STORAGE_KEY_PREFIX = 'reputation_reviews_';

export class InternalReviewAdapter {
  private getStorageKey(orgId: string, propertyId?: string): string {
    const base = `${STORAGE_KEY_PREFIX}${orgId}`;
    return propertyId ? `${base}_${propertyId}` : base;
  }

  async save(event: ReviewEvent): Promise<string> {
    const key = this.getStorageKey(event.orgId, event.propertyId);
    const existing = this.getAllInternal(key);
    
    const reviewToSave: ReviewEvent = {
      ...event,
      id: event.id || crypto.randomUUID(),
      receivedAt: event.receivedAt || new Date().toISOString(),
    };
    
    existing.push(reviewToSave);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(existing));
    }
    
    return reviewToSave.id;
  }

  async findById(orgId: string, reviewId: string, propertyId?: string): Promise<ReviewEvent | null> {
    const key = this.getStorageKey(orgId, propertyId);
    const all = this.getAllInternal(key);
    return all.find(r => r.id === reviewId) || null;
  }

  async findAll(filter: ReviewFilter): Promise<ReviewEvent[]> {
    const key = this.getStorageKey(filter.orgId, filter.propertyId);
    let results = this.getAllInternal(key);

    if (filter.source) {
      results = results.filter(r => r.source === filter.source);
    }

    if (filter.sentiment) {
      results = results.filter(r => r.sentiment === filter.sentiment);
    }

    if (filter.minRating !== undefined) {
      results = results.filter(r => r.rating >= filter.minRating!);
    }

    if (filter.maxRating !== undefined) {
      results = results.filter(r => r.rating <= filter.maxRating!);
    }

    if (filter.fromDate) {
      results = results.filter(r => r.publishedAt >= filter.fromDate!);
    }

    if (filter.toDate) {
      results = results.filter(r => r.publishedAt <= filter.toDate!);
    }

    results.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const offset = filter.offset || 0;
    const limit = filter.limit || 50;
    
    return results.slice(offset, offset + limit);
  }

  async updateSentiment(
    orgId: string, 
    reviewId: string, 
    sentiment: ReviewSentiment,
    propertyId?: string
  ): Promise<boolean> {
    const key = this.getStorageKey(orgId, propertyId);
    const all = this.getAllInternal(key);
    const index = all.findIndex(r => r.id === reviewId);
    
    if (index === -1) return false;
    
    all[index] = { ...all[index], sentiment };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(all));
    }
    
    return true;
  }

  async addResponse(
    orgId: string,
    reviewId: string,
    response: { content: string; authorName: string },
    propertyId?: string
  ): Promise<boolean> {
    const key = this.getStorageKey(orgId, propertyId);
    const all = this.getAllInternal(key);
    const index = all.findIndex(r => r.id === reviewId);
    
    if (index === -1) return false;
    
    all[index] = {
      ...all[index],
      response: {
        ...response,
        respondedAt: new Date().toISOString(),
      },
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(all));
    }
    
    return true;
  }

  async delete(orgId: string, reviewId: string, propertyId?: string): Promise<boolean> {
    const key = this.getStorageKey(orgId, propertyId);
    const all = this.getAllInternal(key);
    const filtered = all.filter(r => r.id !== reviewId);
    
    if (filtered.length === all.length) return false;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(filtered));
    }
    
    return true;
  }

  private getAllInternal(key: string): ReviewEvent[] {
    if (typeof window === 'undefined') return [];
    
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    try {
      return JSON.parse(data) as ReviewEvent[];
    } catch {
      return [];
    }
  }
}

export const reviewAdapter = new InternalReviewAdapter();
