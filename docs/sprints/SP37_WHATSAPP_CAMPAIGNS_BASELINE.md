# SP37 - WhatsApp Campaigns Baseline

Phase: 14  
Sprint: 37

## Objective
Implement a safe WhatsApp campaigns baseline with queue-first integration and adapter isolation, preserving UPH pilot stability.

## Delivered
- Internal WhatsApp marketing adapter (`InternalWhatsAppMarketingAdapter`) behind adapter contract.
- WhatsApp campaigns orchestrator (`WhatsAppMarketingLayer`) with queue-first flow:
  - enqueue campaign request in outbox
  - process event through bus handler
  - apply existing retry and dead-letter behavior on failures
- Baseline campaign placeholders:
  - broadcast
  - promotion
  - reengagement
- Governance safeguards:
  - mandatory `orgId` and optional `propertyId`
  - required `correlationId` in event and logs
  - consent gate (`marketingWhatsAppAllowed`)
  - feature flag gate (`whatsAppMarketing`) scoped by tenant/property
- Audience validation for non-empty and valid E.164 phone recipients.

## Out of Scope
- External WhatsApp provider integration and credentials.
- Mass campaign optimization and scheduling strategies.

## Exit Criteria
- Build/typecheck/eslint pass.
- Evidence logs captured under `docs/qa/SP37/`.
- Phase 14 docs updated with SP37 result.
