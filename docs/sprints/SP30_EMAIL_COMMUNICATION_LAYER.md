# SP30 - Email Communication Layer Baseline (Transactional-First)

Phase: 12  
Sprint: 30

## Objective
Implement a decoupled transactional email communication layer using Integration Hub primitives (event bus, outbox queue, observability), while preserving pilot stability and avoiding real provider integration.

## Delivered
- Internal transactional email adapter (`InternalTransactionalEmailAdapter`) isolated behind adapter interface.
- Email communication orchestrator (`EmailCommunicationLayer`) with queue-first flow:
  - enqueue transactional request in outbox
  - process message through event bus handler
  - success/failure transition control with existing retry policy
- Event bus reliability adjustment for retry compatibility:
  - dedupe key is persisted only after successful handler execution
  - handler exceptions are logged before rethrow for outbox retry accounting
- Transactional placeholders supported for:
  - booking confirmation
  - pre-arrival reminder
  - check-out follow-up
- Tenant/context and traceability safeguards:
  - mandatory `orgId` and optional `propertyId`
  - required `correlationId` on every event (generated when absent)
  - consent gate (`transactionalEmailAllowed`) before enqueue
  - tenant/property feature flag guard (`transactionalEmail`)
- Minimal recipient validation to block invalid transactional sends.

## Out of Scope
- Real email providers (SES, SendGrid, Postmark, etc.).
- Campaign or marketing communication workflows.
- Durable outbox/worker persistence.

## Exit Criteria
- Build/typecheck/eslint pass.
- Evidence logs captured under `docs/qa/SP30/`.
- Phase 12 milestone docs updated with SP30 result.
