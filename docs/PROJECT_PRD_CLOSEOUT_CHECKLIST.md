# PROJECT PRD Closeout Checklist (UPH Pilot)

Use this checklist as the final Go/No-Go control before PRD pilot start.

## A) Core Governance & Delivery

- [ ] All remaining phases (7-10) have PASS reports:
  - `docs/milestones/PHASE_7_REPORT.md`
  - `docs/milestones/PHASE_8_REPORT.md`
  - `docs/milestones/PHASE_9_REPORT.md`
  - `docs/milestones/PHASE_10_REPORT.md`
- [ ] All sprint folders under `docs/qa/SPxx/` contain required logs and report files.
- [ ] No sprint marked PARTIAL/FAIL without approved waiver.

## B) Existing Hard Gates (Must PASS)

- [ ] RLS gate PASS:
  - script: [`scripts/ci/run_rls_gate_check.ps1`](../scripts/ci/run_rls_gate_check.ps1)
  - SQL: [`scripts/sql/rls_gate_check.sql`](../scripts/sql/rls_gate_check.sql)
  - workflow: [`.github/workflows/rls-gate.yml`](../.github/workflows/rls-gate.yml)
- [ ] Structural drift gate PASS:
  - script: [`scripts/ci/run_structural_drift_gate.ps1`](../scripts/ci/run_structural_drift_gate.ps1)
  - SQL: [`scripts/sql/structural_fingerprint.sql`](../scripts/sql/structural_fingerprint.sql)
  - workflow: [`.github/workflows/structural-drift-gate.yml`](../.github/workflows/structural-drift-gate.yml)
- [ ] Tenant contract gate PASS:
  - script: [`scripts/ci/run_tenant_contract_gate.ps1`](../scripts/ci/run_tenant_contract_gate.ps1)
  - SQL: [`scripts/sql/tenant_contract_check.sql`](../scripts/sql/tenant_contract_check.sql)
  - workflow: [`.github/workflows/tenant-contract-gate.yml`](../.github/workflows/tenant-contract-gate.yml)
- [ ] Migration naming gate PASS:
  - script: [`scripts/ci/check_migration_naming.ps1`](../scripts/ci/check_migration_naming.ps1)
  - workflow: [`.github/workflows/migration-discipline-gate.yml`](../.github/workflows/migration-discipline-gate.yml)

## C) Observability Readiness

- [ ] Error tracking integration configured and validated in staging.
- [ ] Alert policy documented with severity/owner/escalation.
- [ ] Health checks implemented and runnable in CI/ops.
- [ ] Monitoring dashboards and on-call window defined for pilot.

Reference baseline:
- Existing doc: [`docs/production_readiness_checklist.md`](./production_readiness_checklist.md)
- MISSING (to create): `docs/observability/SP19_ALERT_POLICY.md`
- MISSING (to create): `scripts/ci/run_health_checks.ps1`
- MISSING (to create): `scripts/sql/health_checks.sql`

## D) Security Readiness

- [ ] Least privilege validated for CI/runtime identities.
- [ ] Secrets inventory reviewed (no plaintext secrets in tracked files/logs).
- [ ] Current RLS audit report published and approved.
- [ ] Tenant leakage negative tests re-executed in latest cycle.

Reference:
- Existing docs:
  - [`docs/rls_policy_hardening_summary.md`](./rls_policy_hardening_summary.md)
  - [`docs/rls_risk_matrix.md`](./rls_risk_matrix.md)
  - [`docs/edge_functions_security_audit.md`](./edge_functions_security_audit.md)
- MISSING (to create): `docs/security/SP21_RLS_AUDIT_REPORT.md`
- MISSING (to create): `docs/security/SP22_SECRETS_ACCESS_REVIEW.md`

## E) Operations Readiness

- [ ] Incident response runbook approved (roles, escalation, SLAs).
- [ ] Rollback runbook tested for app and DB scenarios.
- [ ] Backup/restore drill executed with RTO/RPO evidence.
- [ ] Operational command packs are deterministic and versioned.

Reference:
- Existing docs:
  - [`docs/db/DR0_EXECUTION_RUNBOOK.md`](./db/DR0_EXECUTION_RUNBOOK.md)
  - [`docs/db/DR0A_EXECUTION_PLAN.md`](./db/DR0A_EXECUTION_PLAN.md)
- MISSING (to create): `docs/ops/SP23_INCIDENT_ROLLBACK_RUNBOOK.md`
- MISSING (to create): `docs/ops/SP24_BACKUP_RESTORE_DRILL_REPORT.md`

## F) UPH Pilot Readiness

- [ ] UPH config pack versioned and approved.
- [ ] Pilot go-live runbook approved and shared to on-call.
- [ ] Monitoring window defined with owner per shift.
- [ ] Pilot sign-off document completed (Go/No-Go).

Reference:
- Existing data baseline:
  - [`docs/EXEC_PLAN_HOST_CONNECT.md`](./EXEC_PLAN_HOST_CONNECT.md)
  - [`docs/db/DR0A_EVIDENCE_REPORT_20260301_042722_UTC.md`](./db/DR0A_EVIDENCE_REPORT_20260301_042722_UTC.md)
- MISSING (to create): `docs/pilot/UPH_PILOT_GO_LIVE_RUNBOOK.md`

## G) Final Go/No-Go Rule

- GO only if all sections A-F are complete and all critical gates are PASS.
- NO-GO if any hard gate fails, any unresolved P0/P1 security/tenant issue exists, or required evidence is missing.

