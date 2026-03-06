# EXEC PLAN - Remaining Work to PRD Pilot (UPH)

## 1) Current Project Status (Evidence-Based)

- Repository: `aistudio-host-connect-admin`
- Last known commit at plan generation: `8cc7bd8`
- Governance mode: CONNECT (per-sprint QA evidence, PASS/FAIL verdict, sync-to-git only on PASS)
- Completed phases:
  - [PHASE_1_REPORT.md](./milestones/PHASE_1_REPORT.md) - PASS
  - [PHASE_2_REPORT.md](./milestones/PHASE_2_REPORT.md) - PASS
  - [PHASE_3_REPORT.md](./milestones/PHASE_3_REPORT.md) - PASS
  - [PHASE_4_REPORT.md](./milestones/PHASE_4_REPORT.md) - PASS
  - [PHASE_5_REPORT.md](./milestones/PHASE_5_REPORT.md) - PASS
  - [PHASE_6_REPORT.md](./milestones/PHASE_6_REPORT.md) - PASS

## 2) Existing Gate Assets (Confirmed)

- Gate scripts (CI runtime):
  - [`scripts/ci/run_rls_gate_check.ps1`](../scripts/ci/run_rls_gate_check.ps1)
  - [`scripts/ci/run_structural_drift_gate.ps1`](../scripts/ci/run_structural_drift_gate.ps1)
  - [`scripts/ci/run_tenant_contract_gate.ps1`](../scripts/ci/run_tenant_contract_gate.ps1)
  - [`scripts/ci/check_migration_naming.ps1`](../scripts/ci/check_migration_naming.ps1)
- SQL checks:
  - [`scripts/sql/rls_gate_check.sql`](../scripts/sql/rls_gate_check.sql)
  - [`scripts/sql/structural_fingerprint.sql`](../scripts/sql/structural_fingerprint.sql)
  - [`scripts/sql/tenant_contract_check.sql`](../scripts/sql/tenant_contract_check.sql)
- CI workflows:
  - [`.github/workflows/rls-gate.yml`](../.github/workflows/rls-gate.yml)
  - [`.github/workflows/structural-drift-gate.yml`](../.github/workflows/structural-drift-gate.yml)
  - [`.github/workflows/tenant-contract-gate.yml`](../.github/workflows/tenant-contract-gate.yml)
  - [`.github/workflows/migration-discipline-gate.yml`](../.github/workflows/migration-discipline-gate.yml)

## 3) Remaining Phases to Reach PRD Pilot

## Phase 7 - Production Readiness & Observability

### Objective
Establish production-grade observability, health monitoring, and release readiness evidence for UPH pilot.

### Sprint SP19 - Observability Baseline & Health Checks

#### Scope
- Define and implement operational health checks for critical paths (auth, DB connectivity, key routes).
- Define error tracking baseline and alert policy map for pilot window.
- Standardize evidence outputs for observability signals.

#### Acceptance Criteria
- Health checks executable in CI/manual pipeline.
- Alert severity policy documented and mapped to owners/escalation.
- Evidence artifacts generated deterministically in `docs/qa/SP19/`.

#### Required QA Commands
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`
- `./scripts/ci/run_rls_gate_check.ps1`
- `./scripts/ci/run_structural_drift_gate.ps1`
- `./scripts/ci/run_tenant_contract_gate.ps1`
- `./scripts/ci/check_migration_naming.ps1`

#### Required Evidence Outputs
- `docs/qa/SP19/build.log`
- `docs/qa/SP19/typecheck.log`
- `docs/qa/SP19/lint_changed_files.log`
- `docs/qa/SP19/sql/rls_gate.log`
- `docs/qa/SP19/sql/structural_drift_gate.log`
- `docs/qa/SP19/sql/tenant_contract_gate.log`
- `docs/qa/SP19/sql/migration_naming_gate.log`
- `docs/qa/SP19/SP19_REPORT.md`

### Sprint SP20 - Release Readiness Dry-Run

#### Scope
- Dry-run release checklist against STAGING/UAT.
- Validate rollback plan and release communication protocol.
- Validate CLI-only monitoring evidence collection for go-live window.

#### Acceptance Criteria
- Dry-run executed end-to-end with no unresolved blocker.
- Rollback steps reproducible and time-bounded.
- PRD go-live command list reviewed and versioned.

#### Required QA Commands
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`
- `supabase migration list --linked`
- `supabase db push --linked` (only if migration included in sprint)

#### Required Evidence Outputs
- `docs/qa/SP20/build.log`
- `docs/qa/SP20/typecheck.log`
- `docs/qa/SP20/lint_changed_files.log`
- `docs/qa/SP20/sql/release_dry_run.log`
- `docs/qa/SP20/sql/migration_list.log`
- `docs/qa/SP20/SP20_REPORT.md`

### Phase 7 PASS / PARTIAL / FAIL
- PASS: SP19 and SP20 PASS + all required evidence files present.
- PARTIAL: delivery completed but any required command/evidence missing.
- FAIL: any gate fails, build/typecheck fails, or release dry-run unresolved blockers.

### Phase 7 Closure Deliverable
- `docs/milestones/PHASE_7_REPORT.md`

---

## Phase 8 - Security & RLS Audit Closure

### Objective
Complete final security hardening and auditable RLS/tenant isolation re-validation before pilot go-live.

### Sprint SP21 - Full RLS Audit & Least Privilege

#### Scope
- Run full RLS audit with current schema and policy inventory.
- Validate least privilege access for service/user roles in pilot scope.
- Produce explicit risk matrix with mitigation status.

#### Acceptance Criteria
- No high-severity unresolved tenant leakage path.
- RLS/tenant contract checks PASS with current schema.
- Least privilege review documented and approved.

#### Required QA Commands
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`
- `./scripts/ci/run_rls_gate_check.ps1`
- `./scripts/ci/run_tenant_contract_gate.ps1`
- `./scripts/ci/run_structural_drift_gate.ps1`

#### Required Evidence Outputs
- `docs/qa/SP21/build.log`
- `docs/qa/SP21/typecheck.log`
- `docs/qa/SP21/lint_changed_files.log`
- `docs/qa/SP21/sql/rls_gate.log`
- `docs/qa/SP21/sql/tenant_contract_gate.log`
- `docs/qa/SP21/sql/structural_drift_gate.log`
- `docs/qa/SP21/SP21_REPORT.md`

### Sprint SP22 - Secrets & Access Hardening

#### Scope
- Validate secrets handling model for CI and runtime.
- Validate no secrets leakage in docs/scripts/logs.
- Validate privilege boundaries in deployment/pipeline identities.

#### Acceptance Criteria
- Secrets inventory and ownership documented.
- No plaintext secret detected in tracked files.
- Access boundary checklist completed.

#### Required QA Commands
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`
- `rg -n "(SUPABASE_DB_PASSWORD|DATABASE_URL|PGPASSWORD|API_KEY|TOKEN)" docs scripts src`

#### Required Evidence Outputs
- `docs/qa/SP22/build.log`
- `docs/qa/SP22/typecheck.log`
- `docs/qa/SP22/lint_changed_files.log`
- `docs/qa/SP22/security/secrets_scan.log`
- `docs/qa/SP22/SP22_REPORT.md`

### Phase 8 PASS / PARTIAL / FAIL
- PASS: SP21 and SP22 PASS + no unresolved high-risk security finding.
- PARTIAL: evidence incomplete or open medium-risk findings without approved waivers.
- FAIL: unresolved high-risk issue (tenant leakage, secret exposure, privilege bypass).

### Phase 8 Closure Deliverable
- `docs/milestones/PHASE_8_REPORT.md`

---

## Phase 9 - Operations & DR Runbooks

### Objective
Guarantee operational resilience with documented and tested runbooks (incident, rollback, backup/restore, DR drill).

### Sprint SP23 - Incident & Rollback Runbooks

#### Scope
- Document incident response runbook (roles, severity, escalation matrix).
- Document rollback runbook for app + DB migration scenarios.
- Validate command-level reproducibility in controlled drill.

#### Acceptance Criteria
- Runbooks complete, versioned, and referenced in sprint evidence.
- Rollback dry-run executed with expected outcomes.
- Escalation matrix and ownership explicit.

#### Required QA Commands
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`
- `supabase migration list --linked`
- `supabase db push --linked` (only if DB touched in drill scope)

#### Required Evidence Outputs
- `docs/qa/SP23/build.log`
- `docs/qa/SP23/typecheck.log`
- `docs/qa/SP23/lint_changed_files.log`
- `docs/qa/SP23/ops/rollback_dry_run.log`
- `docs/qa/SP23/SP23_REPORT.md`

### Sprint SP24 - Backup/Restore & DR Drill

#### Scope
- Define backup/restore checklist with RTO/RPO targets.
- Execute DR tabletop or technical drill and capture timings.
- Validate pilot recovery communication flow.

#### Acceptance Criteria
- Backup/restore drill evidence complete and auditable.
- RTO/RPO targets measured and documented.
- Open DR actions assigned with owners and deadlines.

#### Required QA Commands
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`
- `supabase projects list`
- `supabase db --help` (command availability evidence for ops runbook references)

#### Required Evidence Outputs
- `docs/qa/SP24/build.log`
- `docs/qa/SP24/typecheck.log`
- `docs/qa/SP24/lint_changed_files.log`
- `docs/qa/SP24/ops/backup_restore_drill.log`
- `docs/qa/SP24/ops/rto_rpo_measurements.md`
- `docs/qa/SP24/SP24_REPORT.md`

### Phase 9 PASS / PARTIAL / FAIL
- PASS: SP23 and SP24 PASS + DR drill executed with measured outcomes.
- PARTIAL: runbooks exist but drill evidence missing/incomplete.
- FAIL: no validated rollback/restore path.

### Phase 9 Closure Deliverable
- `docs/milestones/PHASE_9_REPORT.md`

---

## Phase 10 - UPH Pilot Go-Live

### Objective
Execute controlled pilot launch for UPH with monitored stabilization window and formal go/no-go governance.

### Sprint SP25 - UPH Pilot Readiness Pack

#### Scope
- Freeze pilot configuration pack (tenant, properties, permissions, operational toggles).
- Validate all hard gates (RLS, structural drift, tenant contract, migration naming).
- Publish pilot run command pack and monitoring window schedule.

#### Acceptance Criteria
- Pilot readiness pack approved and versioned.
- All existing hard gates PASS in pre-go-live check.
- Open critical blockers = 0.

#### Required QA Commands
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`
- `./scripts/ci/run_rls_gate_check.ps1`
- `./scripts/ci/run_structural_drift_gate.ps1`
- `./scripts/ci/run_tenant_contract_gate.ps1`
- `./scripts/ci/check_migration_naming.ps1`

#### Required Evidence Outputs
- `docs/qa/SP25/build.log`
- `docs/qa/SP25/typecheck.log`
- `docs/qa/SP25/lint_changed_files.log`
- `docs/qa/SP25/sql/rls_gate.log`
- `docs/qa/SP25/sql/structural_drift_gate.log`
- `docs/qa/SP25/sql/tenant_contract_gate.log`
- `docs/qa/SP25/sql/migration_naming_gate.log`
- `docs/qa/SP25/pilot/uph_config_pack.md`
- `docs/qa/SP25/SP25_REPORT.md`

### Sprint SP26 - Go-Live Monitoring Window & Sign-off

#### Scope
- Execute monitored go-live window with on-call roster.
- Capture incident-free/incident-managed evidence.
- Produce final pilot closeout and sign-off.

#### Acceptance Criteria
- Monitoring window completed with evidence and incident log.
- No unresolved P0/P1 blocker at closeout.
- Final pilot sign-off document approved.

#### Required QA Commands
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`
- `./scripts/ci/run_rls_gate_check.ps1`
- `./scripts/ci/run_structural_drift_gate.ps1`
- `./scripts/ci/run_tenant_contract_gate.ps1`
- `./scripts/ci/check_migration_naming.ps1`

#### Required Evidence Outputs
- `docs/qa/SP26/build.log`
- `docs/qa/SP26/typecheck.log`
- `docs/qa/SP26/lint_changed_files.log`
- `docs/qa/SP26/sql/rls_gate.log`
- `docs/qa/SP26/sql/structural_drift_gate.log`
- `docs/qa/SP26/sql/tenant_contract_gate.log`
- `docs/qa/SP26/sql/migration_naming_gate.log`
- `docs/qa/SP26/pilot/monitoring_window_log.md`
- `docs/qa/SP26/pilot/pilot_signoff.md`
- `docs/qa/SP26/SP26_REPORT.md`

### Phase 10 PASS / PARTIAL / FAIL
- PASS: SP25 and SP26 PASS + pilot sign-off published.
- PARTIAL: pilot running but sign-off/evidence incomplete.
- FAIL: hard gate fail or unresolved critical incident.

### Phase 10 Closure Deliverable
- `docs/milestones/PHASE_10_REPORT.md`

---

## 4) Missing Assets Detected (Must Be Created in Remaining Work)

- MISSING: `scripts/ci/run_health_checks.ps1`
- MISSING: `scripts/sql/health_checks.sql`
- MISSING: `docs/observability/SP19_ALERT_POLICY.md`
- MISSING: `docs/security/SP21_RLS_AUDIT_REPORT.md`
- MISSING: `docs/security/SP22_SECRETS_ACCESS_REVIEW.md`
- MISSING: `docs/ops/SP23_INCIDENT_ROLLBACK_RUNBOOK.md`
- MISSING: `docs/ops/SP24_BACKUP_RESTORE_DRILL_REPORT.md`
- MISSING: `docs/pilot/UPH_PILOT_GO_LIVE_RUNBOOK.md`

These items are explicitly included in Phases 7-10 scope and should be delivered before PRD pilot sign-off.

