# SP33 - Lead Capture Baseline (Guest CRM)

Phase: 13  
Sprint: 33

## Objective
Establish a safe lead capture baseline for Guest CRM using Integration Hub primitives, preserving UPH pilot stability and avoiding external provider coupling.

## Delivered
- Internal lead capture adapter (`InternalLeadCaptureAdapter`) isolated behind adapter interface.
- Lead capture orchestrator (`LeadCaptureLayer`) with queue-first flow:
  - enqueue lead capture request in outbox
  - process request through event bus handler
  - success/failure transitions through existing retry and dead-letter behavior
- Lead source placeholders supported for:
  - website
  - instagram
  - whatsapp
  - campaign
- Tenant/context and traceability safeguards:
  - mandatory `orgId` and optional `propertyId`
  - required `correlationId` on every event (generated when absent)
  - consent gate (`contactAllowed`) before enqueue
  - tenant/property feature flag guard (`leadCapture`)
- Contact validation for email/phone to block invalid capture requests.

## Out of Scope
- Persistent CRM storage in database.
- External lead providers and ad platform connectors.
- Automated guest lifecycle sequences.

## Exit Criteria
- Build/typecheck/eslint pass.
- Evidence logs captured under `docs/qa/SP33/`.
- Phase 13 milestone docs updated with SP33 result.
