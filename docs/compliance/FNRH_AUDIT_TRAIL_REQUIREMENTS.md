# FNRH Audit Trail Requirements (SP51)

Date: 2026-03-06
Status: Baseline requirement definition

## Objective

Define mandatory audit trail controls for FNRH compliance flows before live provider activation.

## Audit event scope

Capture audit records for:
- payload preparation requested
- payload validation completed
- payload rejected (BLOCK)
- queue retry scheduled
- dead-letter transition
- manual replay/reprocessing actions

## Required audit fields

Every audit event must contain:
- `timestamp` (ISO-8601)
- `orgId`
- `propertyId`
- `correlationId`
- `submissionId`
- `lifecycleStage`
- `eventType`
- `status`
- `attempt`
- `actorType` (`system` or `operator`)
- `payloadHash`
- `errorCode` (when applicable)

## PII handling in audit trails

Mandatory rules:
- Do not log full guest document/email/phone in raw form
- Use masked display values only when needed for operations
- Keep full payload only in protected encrypted stores when legally required
- Prefer payload hash references in standard audit streams

## Immutability and integrity

Requirements:
- Audit records must be append-only
- Updates should be represented as new audit events, not mutations
- Hash verification mechanism should allow tamper detection

## Access control

Requirements:
- Least-privilege access by role
- Read access segmented by tenant/property scope
- Replay actions restricted to authorized operations/compliance roles
- Access events to audit data should be auditable

## Retention and legal posture

Requirements:
- Retention policy must align with legal/compliance obligations for hospitality guest registration records
- Retention windows and purge jobs must be policy-driven and documented
- Secure deletion required after retention expiry

## Operational review process

Minimum cadence:
- Daily review of invalid and DLQ submissions
- Weekly trend review by tenant/property
- Incident workflow for sustained BLOCK or DLQ spikes

## Future implementation checklist

- persistent audit event store
- signed/hashed event chain or equivalent integrity control
- operator replay console with full audit linkage
- exportable compliance reports per property
