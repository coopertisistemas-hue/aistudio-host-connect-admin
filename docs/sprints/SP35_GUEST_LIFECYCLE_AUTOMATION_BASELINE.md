# SP35 - Guest Lifecycle Automation Baseline

Phase: 13  
Sprint: 35

## Objective
Implement baseline guest lifecycle automation primitives (pre-arrival and post-stay) with queue-first processing and tenant-safe controls.

## Delivered
- Internal lifecycle automation adapter (`InternalLifecycleAutomationAdapter`) with in-memory dispatch records.
- Lifecycle automation orchestrator (`LifecycleAutomationLayer`) with queue-first flow:
  - enqueue lifecycle dispatch request in outbox
  - process via event bus handler
  - rely on existing retry and dead-letter behavior on failures
- Baseline lifecycle actions:
  - pre-arrival
  - post-stay
- Tenant/context and traceability safeguards:
  - mandatory `orgId` and optional `propertyId`
  - required `correlationId` on every event (generated when absent)
  - consent gate (`automationAllowed`) before enqueue
  - tenant/property feature flag guard (`lifecycleAutomation`)
- Recipient validation for email and phone.

## Out of Scope
- Real outbound provider integrations.
- Campaign or mass communication workflows.
- Persistent automation history storage.

## Exit Criteria
- Build/typecheck/eslint pass.
- Evidence logs captured under `docs/qa/SP35/`.
- Phase 13 docs updated with SP35 result.
