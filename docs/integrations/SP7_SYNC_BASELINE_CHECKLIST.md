# SP7 Sync Baseline Validation Checklist

## Objective
Define deterministic checks for Reserve <-> Host integration readiness before runtime orchestration (SP8).

## Readiness Checks
1. Contract envelope enforcement
- Every sample request/event includes `contract_version`, `event_type`, `trace_id`, `org_id`.
- Property-scoped messages include `property_id`.

2. Tenant safety checks
- Missing `org_id` must be rejected.
- Cross-tenant `org_id`/`property_id` mismatch must be rejected.
- No consumer-side trust of caller UI context.

3. Idempotency checks
- Replay same `idempotency_key` returns `deduplicated=true`.
- Replay does not create duplicate reservation rows.

4. Compatibility checks
- v1 payload with additive optional fields remains accepted.
- Unsupported major version is rejected with deterministic error code.

5. Audit checks
- Logs include `trace_id`, `event_type`, `org_id`, result.
- No secret/token leakage in logs.

## Minimal Test Matrix (SP7)
- `ReservationCreateRequested` valid payload -> accepted.
- `ReservationCreateRequested` missing `org_id` -> reject `TENANT_SCOPE_VIOLATION`.
- `ReservationLifecycleChanged` replayed event -> no-op dedup.
- `SettlementStatusChanged` with unsupported contract version -> reject `CONTRACT_VERSION_UNSUPPORTED`.

## PASS Criteria
- Contract document approved and versioned (`v1.0`).
- Checklist committed with explicit failure modes.
- Build/typecheck/lint-changed-files logs available in `docs/qa/SP7/`.
- No DB changes required in SP7.

## Evidence Paths
- `docs/integrations/SP7_RESERVE_HOST_CONTRACT_V1.md`
- `docs/integrations/SP7_SYNC_BASELINE_CHECKLIST.md`
- `docs/qa/SP7/build.log`
- `docs/qa/SP7/typecheck.log`
- `docs/qa/SP7/lint_changed_files.log`
