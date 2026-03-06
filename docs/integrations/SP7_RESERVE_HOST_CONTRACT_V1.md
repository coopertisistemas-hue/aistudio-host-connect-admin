# SP7 Reserve-Host Contract v1

## Objective
Define the canonical Reserve Connect <-> Host Connect integration contract baseline for Phase 3 with strict tenant isolation, idempotency, and auditable behavior.

## Governance Anchors
- AI_RULES.md (RLS-first, no manual drift, deterministic evidence)
- docs/EXEC_PLAN_PHASE3_RESERVE_CONNECT.md
- docs/integrations/SP3_INTEGRATION_CONTRACT_MATRIX.md

## Contract Versioning
- Current baseline: `v1.0`
- Non-breaking update: `v1.MINOR` (additive fields only)
- Breaking update: `v2.0` with migration plan and dual-run period

## Mandatory Envelope (all Reserve <-> Host messages)
- `contract_version` (string, example `v1.0`)
- `event_type` (string)
- `trace_id` (string, globally unique)
- `occurred_at` (ISO-8601 UTC)
- `source_system` (`reserve` | `host`)
- `org_id` (uuid)
- `property_id` (uuid when property-scoped)
- `payload` (object)

## Canonical Flows (v1)
1. `ReservationCreateRequested`
- Producer: Reserve
- Consumer: Host
- Purpose: create reservation in Host domain
- Required payload keys:
  - `external_reservation_id`
  - `guest`
  - `stay`
  - `pricing`
  - `channel`

2. `ReservationLifecycleChanged`
- Producer: Host
- Consumer: Reserve
- Purpose: sync booking status progression
- Required payload keys:
  - `booking_id`
  - `external_reservation_id`
  - `status`
  - `status_reason` (optional)
  - `changed_at`

3. `SettlementStatusChanged`
- Producer: Host
- Consumer: Reserve
- Purpose: financial settlement feedback loop
- Required payload keys:
  - `booking_id`
  - `invoice_id`
  - `settlement_status`
  - `total_amount`
  - `currency`
  - `changed_at`

## Tenant and Authorization Contract
- `org_id` is mandatory on every tenant-scoped message.
- `property_id` is mandatory for property-scoped operations.
- Consumer must reject payloads without tenant keys.
- Consumer must verify tenant scope server-side (never trust client/front-end).
- Any cross-tenant payload must return deterministic authorization error (`TENANT_SCOPE_VIOLATION`).

## Idempotency Contract
- Idempotency key format:
  - `idempotency_key = source_system + ':' + event_type + ':' + external_reservation_id + ':' + occurred_at`
- Consumer must keep a dedup window (minimum 24h).
- Replayed messages with same key must be no-op and return success with `deduplicated=true`.

## Error Contract
Every rejection must return:
- `code` (stable machine code)
- `message` (safe human message)
- `trace_id`
- `retryable` (boolean)

Baseline error codes:
- `TENANT_SCOPE_VIOLATION`
- `CONTRACT_VERSION_UNSUPPORTED`
- `PAYLOAD_VALIDATION_FAILED`
- `IDEMPOTENCY_KEY_REPLAYED`
- `DOWNSTREAM_TIMEOUT`

## Audit Requirements
- Log `trace_id`, `event_type`, `org_id`, `property_id`, processing result.
- Do not log secrets or full PCI-sensitive payload data.
- Retain enough metadata for deterministic drift and reconciliation checks.

## Compatibility Rules
- Additive fields only in v1.MINOR.
- Field removal/rename requires new MAJOR.
- Status enum additions require MINOR and documented consumer fallback.

## Out of Scope for SP7
- Runtime implementation of orchestration retries.
- Automatic backfill/replay workers.
- Settlement reconciliation dashboard UI.
