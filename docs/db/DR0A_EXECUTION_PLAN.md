# DR0-A Execution Plan (Path A: Repo SSOT)

Date: 2026-03-01  
This plan is execution-ready for manual GP/DEV operation.  
Constraint: this document does not execute DB changes by itself.

## 0. Objective

Rebuild STAGING from repository migrations with deterministic ordering, then re-validate drift until result is "no material drift".

## 1. Required Inputs

- Canonical migration policy: `docs/db/DR0A_CANONICAL_MIGRATION_POLICY.md`
- Evidence SQL pack: `docs/db/DR0A_EVIDENCE_SQL.sql`
- Evidence collector script: `scripts/dr0a_collect_evidence.ps1`
- Governance: `AI_RULES.md`, `ai/CONNECT_GUARDRAILS.md`, `ai/CONNECT_QA_GATES.md`

## 2. Evidence Folder Convention

Use exactly:
- `docs/db/evidence/DR0A/<timestamp>/`

Recommended `<timestamp>` format:
- `YYYYMMDD_HHMMSS_UTC`

Minimum artifacts:
- `00_preflight.txt`
- `01_manifest.txt`
- `02_manifest.sha256.txt`
- `03_migration_apply.log`
- `04_schema_dump_after.sql`
- `05_evidence_text.txt`
- `csv/*.csv`
- `06_drift_revalidation_report.md`
- `07_go_no_go_signoff.md`

## 3. Option A1 (Preferred): Fresh STAGING Project Rebuild

Safer option. Avoids uncertain state carry-over and hidden objects.

### A1.1 Preflight

1. Confirm GP approval for fresh STAGING project.
2. Confirm no production refs/credentials.
3. Freeze migration set for run (manifest freeze).
4. Generate canonical ordered manifest from timestamped forward migrations only.

Command template:

```bash
# Inspect migration folder
ls -1 supabase/migrations

# (Operator step) Build ordered manifest from canonical forward files only
# Save to docs/db/evidence/DR0A/<timestamp>/01_manifest.txt
```

STOP if:
- Nonstandard forward files unresolved.
- Rollback file appears in manifest.

### A1.2 Rebuild and Apply

Command template:

```bash
# Link CLI to fresh STAGING project (operator-provided)
supabase link --project-ref <staging_project_ref>

# Apply canonical migrations
supabase db push --linked

# Dump resulting public schema
supabase db dump --linked --schema public -f docs/db/evidence/DR0A/<timestamp>/04_schema_dump_after.sql
```

STOP if:
- `db push` fails.
- unexpected migration order is observed.

### A1.3 Validation and Drift Re-check

1. Run `scripts/dr0a_collect_evidence.ps1`.
2. Compare new dump with expected migration-derived model.
3. Produce `06_drift_revalidation_report.md`.

PASS criteria (summary):
- `booking_groups` exists.
- `property_photos` exists.
- No expected tenant table missing RLS.
- No RLS-enabled table with zero policies (unless explicitly approved with documented rationale).
- Drift result: no `P0` or `P1` material structural divergence.

## 4. Option A2 (Fallback): Reset Existing STAGING

Use only if GP explicitly accepts destructive reset/data loss risk.

### A2.1 Additional Preconditions

1. Written GP approval for reset/data loss.
2. Export pre-reset schema/data evidence.
3. Confirm recovery/rollback path documented.

Command template:

```bash
# Link current STAGING
supabase link --project-ref <staging_project_ref>

# Capture before snapshot
supabase db dump --linked --schema public -f docs/db/evidence/DR0A/<timestamp>/before_reset_public.sql
```

### A2.2 Reset + Re-apply

Command template:

```bash
# Operator executes reset according to environment policy
# then reapplies canonical migrations
supabase db push --linked
```

Then run same validation steps as A1.

STOP if:
- reset approval not documented.
- post-reset state still shows material drift.

## 5. Validation Query PASS Criteria

Reference SQL file: `docs/db/DR0A_EVIDENCE_SQL.sql`.

1. RLS enabled status (all public tables):
   - PASS: every tenant-scoped table has `rls_enabled = true`.
2. RLS-enabled with zero policies:
   - PASS: empty result set, or only GP-approved locked-down tables with written exception.
3. Policy counts by table/command:
   - PASS: no unexplained missing command coverage for required CRUD model.
4. Critical table existence:
   - PASS: exactly two rows returned: `booking_groups`, `property_photos`.
5. Index inventory:
   - PASS: no missing critical tenant/join indexes from canonical model.
6. Trigger inventory:
   - PASS: expected lifecycle/security triggers present; no unexplained extras.
7. Function signatures:
   - PASS: no unexplained public function drift.
8. Deterministic snapshots:
   - PASS: repeated runs produce stable ordered evidence outputs.

## 6. STOP/GO Decision Gates

GO only if all are PASS:
- Migration Validation Gate
- RLS Validation Gate
- Drift Re-validation Gate ("no material drift")

STOP if any:
- P0 drift exists.
- Any unresolved nonstandard forward migration handling.
- Evidence package incomplete.

## 7. Recommendation

Proceed with **Option A1** by default.  
Use **Option A2** only when GP explicitly accepts destructive reset risk and signs off in `DR0A_GO_NO_GO.md`.

