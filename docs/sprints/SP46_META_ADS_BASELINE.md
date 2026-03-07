# SP46 - Meta Ads Baseline

## Objective

Implement the internal baseline architecture for Meta Ads integration with adapter isolation, tenant/property safety, feature-flag guard, and queue-first compatibility, without real provider API calls.

## Scope

- New module: `src/integrations/paidTraffic/`
- Contracts and event types for Meta Ads ingestion
- Internal adapter for tenant-safe in-memory storage placeholder
- Baseline layer with:
  - feature flag guard
  - correlationId propagation
  - outbox/event-bus flow
  - retry-compatible processing

## Out of Scope

- Real Meta provider API integration
- Database changes or migrations
- Changes to core PMS runtime flows

## Deliverables

- `src/integrations/paidTraffic/types.ts`
- `src/integrations/paidTraffic/internalMetaAdsAdapter.ts`
- `src/integrations/paidTraffic/metaAdsBaselineLayer.ts`
- `src/integrations/paidTraffic/index.ts`
- `docs/qa/SP46/*`
- `docs/milestones/PHASE_18_REPORT.md` update

## Notes

- SP45 is considered already approved by Orchestrator (Google Ads baseline).
- SP46 closes only Meta Ads baseline and phase report progress update.
