# SP38 - Campaign Analytics Baseline

Phase: 14  
Sprint: 38

## Objective
Implement a campaign analytics baseline for marketing channels using queue-first integration and adapter isolation.

## Delivered
- Internal analytics adapter (`InternalCampaignAnalyticsAdapter`) with normalized conversion metrics.
- Analytics orchestrator (`CampaignAnalyticsLayer`) with queue-first flow:
  - enqueue analytics request in outbox
  - process event through bus handler
  - apply existing retry and dead-letter behavior on failures
- Baseline analytics support for channels:
  - email
  - whatsapp
- Governance safeguards:
  - mandatory `orgId` and optional `propertyId`
  - required `correlationId` in event path
  - feature flag gate (`campaignAnalytics`) scoped by tenant/property
- Metrics integrity validation:
  - non-negative values
  - ordered funnel constraints (`sent >= delivered >= opened >= clicked >= converted`)

## Out of Scope
- Dashboard UI.
- External BI exports.
- Persistent analytics warehouse.

## Exit Criteria
- Build/typecheck/eslint pass.
- Evidence logs captured under `docs/qa/SP38/`.
- Phase 14 docs updated with SP38 result.
