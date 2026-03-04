# SP19 Operational Signals Inventory

## Purpose
Define what to monitor now, where to read it, and expected healthy state.

| Signal | Source Type | Source | Where to View | Healthy / Good State |
|---|---|---|---|---|
| Build Integrity | CI/App | `pnpm build` | `docs/qa/SPxx/build.log` | Exit code 0, no build failure |
| Type Integrity | CI/App | `pnpm exec tsc --noEmit` | `docs/qa/SPxx/typecheck.log` | Exit code 0, no TS diagnostics |
| Lint Integrity (Changed Files) | CI/App | `pnpm exec eslint <changed-files>` | `docs/qa/SPxx/lint_changed_files.log` | Exit code 0, no lint errors |
| RLS Compliance | DB Gate | `scripts/ci/run_rls_gate_check.ps1` | `docs/qa/SPxx/sql/rls_gate.log` | No public table with RLS enabled and zero policies |
| Structural Drift | DB Gate | `scripts/ci/run_structural_drift_gate.ps1` | `docs/qa/SPxx/sql/structural_drift_gate.log` | Fingerprint matches committed baseline |
| Tenant Contract | DB Gate | `scripts/ci/run_tenant_contract_gate.ps1` | `docs/qa/SPxx/sql/tenant_contract_gate.log` | No failing rows in mandatory checks |
| Migration Discipline | CI Gate | `scripts/ci/check_migration_naming.ps1` | `docs/qa/SPxx/sql/migration_naming_gate.log` | All forward migrations canonical; no rollback in apply chain |
| Billing Dunning Queue | App/Operational | Billing Orchestration (`/billing/orchestration`) | UI + export CSV | Retry queue controlled, no unexplained spikes |
| Subscription Lifecycle Status | App/Operational | `/billing/subscription-lifecycle` | UI | Status transitions consistent with policy |
| Revenue Assurance GO/NO-GO | App/Operational | `/billing/revenue-assurance` | UI | `GO` for pilot opening window |
| Reserve↔Host Integration Stability | Contract/Operational | Integration contract + sync checklist | `docs/integrations/*` + sprint evidence | No unresolved sync failure trend |
| Health Checks | MISSING | `scripts/ci/run_health_checks.ps1` (planned) | Planned `docs/qa/SP19/ops/health_checks.log` | Endpoint probes and auth/db checks green |

## Notes
- Signals marked `MISSING` are planned for remaining-to-PRD phases and must be implemented before pilot go-live.
- No screenshot evidence required; all observability proof is CLI/log-based.

