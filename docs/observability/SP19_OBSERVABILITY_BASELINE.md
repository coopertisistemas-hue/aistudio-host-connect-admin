# SP19 Observability Baseline (CONNECT)

## Scope
Documentation and operational baseline only (no new third-party tooling introduced in SP19).

## Logging Standard
- Levels:
  - `ERROR`: operation failed and user/system impact exists.
  - `WARN`: degraded behavior, fallback activated, retry conditions.
  - `INFO`: lifecycle checkpoints (startup, route transitions, batch summary).
  - `DEBUG`: temporary diagnostics (must be removable/flagged for production).
- Structure (recommended):
  - `timestamp`, `level`, `module`, `message`, `request_id|trace_id`, `org_id` (when safe), `property_id` (when safe), `error_code`.
- Redaction rules (mandatory):
  - Never log secrets, tokens, passwords, full connection strings, raw PII payloads.
  - Mask user identifiers if full value is not required for triage.

## Correlation ID Guidance
- Use `request_id` or `trace_id` in API/edge calls and in UI error surfaces where possible.
- Keep the same correlation value across retry chains and reconciliation jobs.
- Include correlation ID in incident logs and SP evidence files.

## Metrics Baseline

## Existing today (confirmed)
- Build/typecheck/lint health signals per sprint in `docs/qa/SPxx/`.
- DB safety/drift contract gates:
  - `RLS Gate`: [`scripts/ci/run_rls_gate_check.ps1`](../../scripts/ci/run_rls_gate_check.ps1)
  - `Structural Drift Gate`: [`scripts/ci/run_structural_drift_gate.ps1`](../../scripts/ci/run_structural_drift_gate.ps1)
  - `Tenant Contract Gate`: [`scripts/ci/run_tenant_contract_gate.ps1`](../../scripts/ci/run_tenant_contract_gate.ps1)
  - `Migration Naming Gate`: [`scripts/ci/check_migration_naming.ps1`](../../scripts/ci/check_migration_naming.ps1)
- Billing/settlement operational modules:
  - Billing Orchestration
  - Subscription Lifecycle
  - Revenue Assurance (GO/NO-GO)

## To be added later (MISSING in current baseline)
- Automated health-check runner:
  - `scripts/ci/run_health_checks.ps1` (MISSING)
  - `scripts/sql/health_checks.sql` (MISSING)
- Centralized error aggregation policy doc:
  - `docs/observability/SP19_ALERT_POLICY.md` (created in SP19)
- Alert delivery channel configuration (placeholders only in SP19).

## Error Handling Baseline
- UI first look:
  - Check module pages with explicit error state rendering (billing/lifecycle/assurance).
  - Validate fallback behavior does not bypass tenant constraints.
- CLI first look:
  - Review latest sprint logs in `docs/qa/SPxx/`.
  - Re-run hard gates from `scripts/ci/`.

## Integration Baseline (Reserve + Billing)
- Reserve/Host integration evidence expected:
  - Contract docs in `docs/integrations/` (SP7/SP10/SP11).
  - Sync checklists and gate outputs for current release.
- Billing evidence expected:
  - Billing event contract and baseline docs (SP14, SP17, SP18).
  - Revenue Assurance `GO/NO-GO` result before pilot go-live.

## References
- Phase status:
  - [PHASE_1_REPORT.md](../milestones/PHASE_1_REPORT.md)
  - [PHASE_2_REPORT.md](../milestones/PHASE_2_REPORT.md)
  - [PHASE_3_REPORT.md](../milestones/PHASE_3_REPORT.md)
  - [PHASE_4_REPORT.md](../milestones/PHASE_4_REPORT.md)
  - [PHASE_5_REPORT.md](../milestones/PHASE_5_REPORT.md)
  - [PHASE_6_REPORT.md](../milestones/PHASE_6_REPORT.md)
- Remaining-to-PRD planning:
  - [EXEC_PLAN_REMAINING_TO_PRD.md](../EXEC_PLAN_REMAINING_TO_PRD.md)

