# SP19 Runbook Index (Monitoring Actions)

## Purpose
Single operational index for rapid checks during pilot readiness and go-live windows.

## Financial Assurance
- Revenue Assurance module:
  - Route: `/billing/revenue-assurance`
  - Primary output: `GO/NO-GO` with blocking reasons.
  - Action:
    - `NO_GO`: freeze risky financial actions and triage reconciliation deltas first.

## Drift & Security Gates
- RLS gate:
  - Command: `./scripts/ci/run_rls_gate_check.ps1`
  - SQL source: `scripts/sql/rls_gate_check.sql`
- Structural drift gate:
  - Command: `./scripts/ci/run_structural_drift_gate.ps1`
  - SQL source: `scripts/sql/structural_fingerprint.sql`
- Tenant contract gate:
  - Command: `./scripts/ci/run_tenant_contract_gate.ps1`
  - SQL source: `scripts/sql/tenant_contract_check.sql`
- Migration naming gate:
  - Command: `./scripts/ci/check_migration_naming.ps1`

## Quick Local Check Pack
- Build: `pnpm build`
- Typecheck: `pnpm exec tsc --noEmit`
- Lint (changed files): `pnpm exec eslint <changed-files>`
- Drift/security hard gates (sequence):
  1. `./scripts/ci/run_rls_gate_check.ps1`
  2. `./scripts/ci/run_structural_drift_gate.ps1`
  3. `./scripts/ci/run_tenant_contract_gate.ps1`
  4. `./scripts/ci/check_migration_naming.ps1`

## Incident Triage Sequence (First 5-10 Minutes)
1. Confirm scope (single property, single org, global).
2. Check latest deploy/commit and sprint evidence logs.
3. Execute hard gates and compare with last PASS baseline.
4. Validate Revenue Assurance status.
5. Escalate per alert policy if thresholds remain breached.

## Evidence Landing Paths
- Sprint-level: `docs/qa/SPxx/`
- DB/Drift historic evidence: `docs/db/evidence/DR0A/`
- Phase closure: `docs/milestones/PHASE_X_REPORT.md`

