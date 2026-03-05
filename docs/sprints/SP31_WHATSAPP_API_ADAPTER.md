# SP31 - WhatsApp API Adapter Baseline (Transactional-First)

Phase: 12  
Sprint: 31

## Objective
Implement a transactional-first WhatsApp adapter baseline using Integration Hub primitives, preserving UPH pilot stability and keeping real provider integrations out of scope.

## Delivered
- Internal transactional WhatsApp adapter (`InternalTransactionalWhatsAppAdapter`) isolated behind adapter interface.
- WhatsApp communication orchestrator (`WhatsAppCommunicationLayer`) with queue-first flow:
  - enqueue transactional message request in outbox
  - process message through event bus handler
  - success/failure transitions via existing retry and dead-letter behavior
- Transactional placeholders supported for:
  - booking confirmation
  - pre-arrival reminder
  - check-out follow-up
- Tenant/context and traceability safeguards:
  - mandatory `orgId` and optional `propertyId`
  - required `correlationId` on every event (generated when absent)
  - consent gate (`transactionalWhatsAppAllowed`) before enqueue
  - tenant/property feature flag guard (`transactionalWhatsApp`)
- Recipient validation (E.164 format) to prevent invalid dispatch attempts.

## Out of Scope
- Real WhatsApp Business API provider connection and credentials.
- Marketing campaigns and bulk messaging.
- Durable queue/worker persistence.

## Exit Criteria
- Build/typecheck/eslint pass.
- Evidence logs captured under `docs/qa/SP31/`.
- Phase 12 milestone docs updated with SP31 result.
