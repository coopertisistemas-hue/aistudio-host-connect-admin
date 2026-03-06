# DR0-A Closure

Date: 2026-03-01  
Status: **PASS** (Path A: Repo SSOT)

Final evidence package:
- `docs/db/DR0A_EVIDENCE_REPORT_20260301_042722_UTC.md`
- `docs/db/evidence/DR0A/20260301_042722_UTC/`

Outcome summary:
- `booking_groups` and `property_photos` confirmed present.
- `pre_checkin_sessions` and `pre_checkin_submissions` confirmed with RLS enabled and explicit CRUD policies.
- Residual legacy table `public.precheckin_sessions` (no underscore) remediated with explicit policies.
- `q2_rls_enabled_zero_policies.csv` is empty in final evidence.
- RLS Validation Gate: PASS
- Drift Re-validation Gate: PASS

Post-closure guardrail:
- CI now enforces DR0-A regression gate via:
  - SQL check: `scripts/sql/rls_gate_check.sql`
  - Runner: `scripts/ci/run_rls_gate_check.ps1`
  - Workflow: `.github/workflows/rls-gate.yml`
- Any PR/main run fails if a `public` table has `relrowsecurity=true` and zero policies.

Migration discipline post-closure:
- Removed non-canonical/rollback files from `supabase/migrations/` apply chain:
  - moved `ROLLBACK_20251226170000_enforce_org_isolation.sql` to `docs/db/legacy_migrations/rollbacks/`
  - moved `add_phone_to_profiles_and_sync_trigger.sql` and `fixes_trial_limit_logic.sql` to `docs/db/legacy_migrations/`
- Kept canonical placeholders for already-applied remote versions:
  - `20260124143000_remote_only_placeholder.sql`
  - `20260124160000_remote_only_placeholder.sql`
- Rationale: preserve deterministic Repo SSOT history without reapplying legacy SQL.

SP1-D multi-tenant contract gate:
- CI enforces tenant contract checks via:
  - SQL: `scripts/sql/tenant_contract_check.sql`
  - Runner: `scripts/ci/run_tenant_contract_gate.ps1`
  - Workflow: `.github/workflows/tenant-contract-gate.yml`
- Contract rules:
  - Query A (FAIL): any `public` table with `RLS enabled` and no `org_id` unless explicitly allowlisted.
  - Query B (WARN by default): any `RLS + org_id` table whose policy definitions do not reference `org_id` (heuristic), with optional strict fail mode via `TENANT_CONTRACT_STRICT_POLICY_REF=true`.
- Allowlist rationale:
  - Minimal and documented for known global/public or relationship-scoped tables where direct `org_id` is not currently expected.

Canonical table guidance:
- Use `pre_checkin_sessions` and `pre_checkin_submissions` for new development.
- Treat `precheckin_sessions` (legacy, no underscore) as legacy-only and do not use it for new features.

SP1-A schema annotation:
- Added explicit DB comments on `public.precheckin_sessions` (table + key columns) marking it as **LEGACY ONLY** for audit visibility directly in schema metadata.
