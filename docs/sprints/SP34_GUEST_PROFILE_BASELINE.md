# SP34 - Guest CRM Baseline (Profile Upsert)

Phase: 13  
Sprint: 34

## Objective
Implement a guest profile baseline for CRM using Integration Hub primitives and tenant-safe controls, with no external provider coupling.

## Delivered
- Internal guest profile adapter (`InternalGuestProfileAdapter`) with in-memory upsert baseline.
- Guest profile orchestrator (`GuestProfileLayer`) using queue-first processing:
  - enqueue profile upsert request in outbox
  - process via event bus handler
  - route failures to existing retry and dead-letter behavior
- Tenant/context and traceability safeguards:
  - mandatory `orgId` and optional `propertyId`
  - required `correlationId` on every event (generated when absent)
  - consent gate (`profileDataAllowed`) before enqueue
  - tenant/property feature flag guard (`guestProfile`)
- Contact validation for email and phone.

## Out of Scope
- Persistent CRM guest profile tables.
- Advanced segmentation and audience scoring.

## Exit Criteria
- Build/typecheck/eslint pass.
- Evidence logs captured under `docs/qa/SP34/`.
- Phase 13 docs updated with SP34 result.
