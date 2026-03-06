# FNRH Integration Architecture (SP48)

Date: 2026-03-06
Status: Proposed architecture baseline (discovery only)

## Objective

Define a pilot-safe, compliance-oriented architecture for future FNRH integration without changing existing PMS runtime flows.

## Non-negotiable constraints

- No direct FNRH calls from PMS core modules
- Adapter isolation for government provider
- Queue-first submission model
- Tenant/property-level isolation
- Correlation and compliance logging
- Retry + DLQ + idempotency

## Recommended architecture

```text
PMS Lifecycle Event (pre-checkin/check-in/checkout)
  -> Outbox
    -> EventBus
      -> Compliance Integration Layer (FNRH)
        -> FNRH Adapter (provider boundary)
          -> MTur FNRH API
```

## Proposed internal modules (future implementation)

- `src/integrations/compliance/types.ts`
- `src/integrations/compliance/internalFnrhAdapter.ts` (mock/internal baseline)
- `src/integrations/compliance/fnrhComplianceLayer.ts`
- `src/integrations/compliance/index.ts`

No module creation in SP48; this is architecture guidance only.

## Event contract proposal

Proposed internal event types:
- `compliance.fnrh.pre_checkin.requested`
- `compliance.fnrh.checkin.requested`
- `compliance.fnrh.checkout.requested`

Payload envelope should include:
- `orgId`, `propertyId`
- `correlationId`
- `reservationId`
- `lifecycleStage`
- `fnrhPayload` (canonical mapped body)
- `submissionWindow` metadata

## Feature-flag strategy

Gate by tenant/property:
- `fnrhCompliance.enabled`
- Optional scope controls:
  - `orgId`
  - `propertyId`

Rollout sequence:
1. Dark mode (collect + validate, no submit)
2. Controlled submit for selected property
3. Expanded rollout after SLA/error acceptance

## Queue / retry design

Recommended retry classes:
- Retryable:
  - transient network errors
  - 5xx responses
  - timeout/rate-limit classes
- Non-retryable:
  - schema/validation errors
  - authorization/profile misconfiguration requiring operator action

DLQ requirements:
- Full trace payload hash
- last error
- attempt count
- tenant/property context
- replay tooling hook

## Compliance logging model

For each submission attempt, store:
- `correlationId`
- tenant scope (`orgId`, `propertyId`)
- lifecycle stage
- endpoint path
- request payload hash
- response status + response body hash
- attempt and retry state
- actor/system origin

Audit logs must be immutable and queryable for compliance review.

## Privacy and PII controls

- Treat FNRH payload as high-sensitivity PII
- Encrypt payload storage and transport
- Mask documents/identifiers in observability logs
- Access policy: least privilege + audit trails
- Retention schedule aligned with legal/compliance policy

## Multi-property architecture

- One FNRH credential profile per property
- Partition queues by `orgId` + `propertyId`
- Isolated dead-letter streams per property for incident containment

## Offline / contingency operation

When government API is unavailable:
- Keep validated events in queue backlog
- Continue retry policy with exponential backoff
- Escalate to DLQ after threshold
- Preserve operational dashboard for pending legal submissions

Recovery path:
- Ordered replay by lifecycle and event timestamp
- Idempotency key enforcement to avoid duplicate legal records

## Risk register (implementation phase)

- Regulatory schema updates without notice
- Credential lifecycle and token expiry handling
- Submission SLA vs property connectivity constraints
- PII breach risk in logs or replay tooling

## Implementation readiness decision

SP48 discovery supports moving to adapter contract and mock integration sprint.
Production connectivity should only begin after legal/compliance sign-off and tenant pilot gating.
