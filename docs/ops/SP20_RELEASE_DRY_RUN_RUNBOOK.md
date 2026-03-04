# SP20 Release Dry-Run Runbook (STAGING/UAT)

## Objective
Execute a deterministic release readiness rehearsal with evidence capture, without manual DB hotfix.

## Preconditions
- Supabase CLI authenticated and project linked.
- Required env set in operator shell:
  - `DATABASE_URL` or `DR0A_PGURL` (read-only for health checks).
  - `PGPASSWORD` (if needed by `psql`).
- Repository on expected branch/commit and clean working tree.

## Dry-Run Command Sequence (Read-Only unless migration scope is explicit)
1. `supabase --version`
2. `supabase status`
3. `supabase migration list --linked`
4. `powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/ci/run_health_checks.ps1" -OutputPath "docs/qa/SP20/ops/health_checks.log"`
5. `pnpm build`
6. `pnpm exec tsc --noEmit`
7. `pnpm exec eslint <changed-files>`

## Conditional Step (Only if migration included in sprint)
- `supabase db push --linked`
- Must produce explicit evidence in `docs/qa/SP20/sql/db_push.log`.

## Release Readiness Checks
- No unresolved failing checks in health report.
- Migration history aligned (`migration list --linked` without mismatch).
- Build/typecheck/lint PASS.
- Hard gates PASS when applicable.

## Rollback Trigger Conditions
- Any failed health check marked `FAIL`.
- Any unresolved migration mismatch.
- Build/typecheck failure.
- Gate failure (`RLS`, `structural drift`, `tenant contract`, `migration naming`) if executed.

## Communication Protocol (Execution)
- Start dry-run notice: GP -> Orchestrator.
- Blocker escalation: GP -> Orchestrator -> DEV within same window.
- Completion notice: include verdict + evidence paths.

## Evidence Paths
- `docs/qa/SP20/sql/release_dry_run.log`
- `docs/qa/SP20/sql/migration_list.log`
- `docs/qa/SP20/ops/health_checks.log`
- `docs/qa/SP20/build.log`
- `docs/qa/SP20/typecheck.log`
- `docs/qa/SP20/lint_changed_files.log`

