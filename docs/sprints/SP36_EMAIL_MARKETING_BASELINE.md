# SP36 - Email Marketing Baseline

Phase: 14  
Sprint: 36

## Objective
Establish a safe email marketing baseline with adapter isolation and queue-first processing while preserving UPH pilot stability.

## Delivered
- Internal email marketing adapter (`InternalEmailMarketingAdapter`) isolated behind adapter interface.
- Email marketing orchestrator (`EmailMarketingLayer`) with queue-first flow:
  - enqueue campaign request in outbox
  - process event through bus handler
  - apply existing retry and dead-letter behavior on failures
- Baseline campaign placeholders:
  - newsletter
  - promotion
  - retention
- Governance safeguards:
  - mandatory `orgId` and optional `propertyId`
  - required `correlationId` in event and logs
  - consent gate (`marketingEmailAllowed`)
  - feature flag gate (`emailMarketing`) scoped by tenant/property
- Audience validation for non-empty and valid email recipients.

## Out of Scope
- External email provider integration and credentials.
- Cross-channel campaign orchestration.
- Persistent marketing storage.

## Exit Criteria
- Build/typecheck/eslint pass.
- Evidence logs captured under `docs/qa/SP36/`.
- Phase 14 docs updated with SP36 result.
