# Sprint 39: Review Monitoring Baseline

**Date**: 2026-03-06
**Status**: COMPLETED
**Phase**: 15 - Reputation and Local SEO Foundation

## Goal

Establish review monitoring integration primitives for hospitality properties.

## Scope

- ReviewMonitoringLayer implementation
- InternalReviewAdapter with tenant-safe storage
- Queue-first ingestion pattern
- CorrelationId tracing

## Deliverables

### Source Code

| File | Purpose |
|------|---------|
| `src/integrations/reputation/types.ts` | TypeScript interfaces |
| `src/integrations/reputation/InternalReviewAdapter.ts` | Tenant-safe storage |
| `src/integrations/reputation/ReviewMonitoringLayer.ts` | Ingestion layer |
| `src/integrations/reputation/index.ts` | Exports |

## Architecture

```
src/integrations/reputation/
├── types.ts                    # ReviewEvent, ReviewFilter, etc.
├── InternalReviewAdapter.ts    # LocalStorage-based tenant storage
├── ReviewMonitoringLayer.ts    # Queue-first ingestion with correlationId
└── index.ts                    # Public exports
```

## Key Features

1. **Multi-tenant safe**: All operations scoped by orgId (and optional propertyId)
2. **CorrelationId tracing**: Every operation includes correlationId for debugging
3. **Queue-first pattern**: Ingestion returns immediately with correlationId
4. **Adapter isolation**: InternalReviewAdapter can be replaced with real DB
5. **Sentiment detection**: Basic sentiment detection based on rating

## Usage Example

```typescript
import { reviewMonitoring } from '@/integrations/reputation';

// Ingest a review
const result = await reviewMonitoring.ingestReview({
  orgId: 'org_123',
  propertyId: 'prop_456',
  source: 'google',
  externalReviewId: 'google_review_789',
  payload: {
    rating: 5,
    content: 'Excellent stay!',
    authorName: 'John Doe',
    publishedAt: '2026-03-01',
  },
  correlationId: 'corr_123',
});

// Get reviews
const reviews = await reviewMonitoring.getReviews({
  orgId: 'org_123',
  limit: 10,
});
```

## QA Results

- [x] TypeScript compilation: PASS
- [x] Build: PASS
- [x] ESLint: PASS

## Next Steps

- SP40: Reputation Analytics Baseline
- Add database adapter for persistence
- Integrate with event bus for queue-first

## Notes

- No real Google API integration (placeholder only)
- LocalStorage used for demo; should be replaced with Supabase
- Sentiment detection is basic (rating-based)
