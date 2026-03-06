# DR0-A Evidence Report - 20260301_042722_UTC

## Summary

Residual blocker remediation executed for `public.precheckin_sessions` (legacy table sem underscore).

Actions performed:
1. Read-only diagnosis queries (structure, constraints, triggers, dependencies).
2. Applied forward migration:
   - `supabase/migrations/20260301043000_sp0a_precheckin_sessions_rls_policies.sql`
3. Recollected DR0A evidence using:
   - `scripts/dr0a_collect_evidence.ps1 -Timestamp 20260301_042722_UTC`

## What Was Executed

```powershell
supabase db push --linked
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/dr0a_collect_evidence.ps1" -Timestamp "20260301_042722_UTC"
```

## Evidence Paths

- Read-only diagnostics:
  - `docs/db/evidence/DR0A/20260301_042722_UTC/02_precheckin_sessions_readonly_checks.txt`
- Push log:
  - `docs/db/evidence/DR0A/20260301_042722_UTC/03_db_push.log`
- Collector outputs:
  - `docs/db/evidence/DR0A/20260301_042722_UTC/00_preflight.txt`
  - `docs/db/evidence/DR0A/20260301_042722_UTC/05_evidence_text.txt`
  - `docs/db/evidence/DR0A/20260301_042722_UTC/dr0a_collect_evidence.log`
  - `docs/db/evidence/DR0A/20260301_042722_UTC/csv/q1..q8`

## Read-only Diagnosis (precheckin_sessions)

From `02_precheckin_sessions_readonly_checks.txt`:
- Columns include `org_id` (`NOT NULL`) and `booking_id` FK.
- Valid PK/FK/check constraints exist.
- No triggers.
- No foreign-key dependents pointing to this table.

Decision applied: **Option A (KEEP + explicit tenant-scoped policies)**.

## Before/After (q2)

Before (timestamp `20260301_040434_UTC`):
- `q2_rls_enabled_zero_policies.csv` listed:
  - `precheckin_sessions`

After (timestamp `20260301_042722_UTC`):
- `q2_rls_enabled_zero_policies.csv`: **empty** (no rows)

## Key Validation Results

### q1 (RLS enabled status)
- `precheckin_sessions` => `t`
- `pre_checkin_sessions` => `t`
- `pre_checkin_submissions` => `t`

### q3 (policy counts for target tables)
- `precheckin_sessions`: SELECT/INSERT/UPDATE/DELETE = 1 each
- `pre_checkin_sessions`: SELECT/INSERT/UPDATE/DELETE = 1 each
- `pre_checkin_submissions`: SELECT/INSERT/UPDATE/DELETE = 1 each
- `booking_groups`: SELECT/INSERT/UPDATE/DELETE = 1 each
- `property_photos`: SELECT/INSERT/UPDATE/DELETE = 1 each

### q4 (critical tables existence)
- `public,booking_groups`
- `public,property_photos`

## Gate Status

- RLS Validation Gate: **PASS**
  - Reason: no RLS-enabled table remains with zero policies in q2; required target tables have explicit CRUD policies.
- Drift Re-validation Gate: **PASS**
  - Reason: prior residual blocker (`precheckin_sessions` zero-policy) resolved; critical drift checks (q1/q2/q3/q4) now satisfied.

