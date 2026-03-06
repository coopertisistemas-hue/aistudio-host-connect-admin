# DR0-A Evidence Report - 20260301_040434_UTC

## What Was Executed

1. Canonical migration normalization already prepared in repo.
2. `supabase db push --linked` executed.
3. Evidence collection executed:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/dr0a_collect_evidence.ps1" -Timestamp "20260301_040434_UTC"
```

## Evidence Paths

- `docs/db/evidence/DR0A/20260301_040434_UTC/preflight_cli.txt`
- `docs/db/evidence/DR0A/20260301_040434_UTC/03_db_push.log`
- `docs/db/evidence/DR0A/20260301_040434_UTC/00_preflight.txt`
- `docs/db/evidence/DR0A/20260301_040434_UTC/05_evidence_text.txt`
- `docs/db/evidence/DR0A/20260301_040434_UTC/dr0a_collect_evidence.log`
- `docs/db/evidence/DR0A/20260301_040434_UTC/csv/q1..q8`

## db push Status

- Result: `SUCCESS`
- Log confirms: `Remote database is up to date.`

## Quick Findings (q1..q4)

### q4: Critical tables existence

`q4_critical_tables.csv`:
- `public,booking_groups`
- `public,property_photos`

Result: fixed (both present).

### q1: RLS enabled status

- `pre_checkin_sessions`: `t`
- `pre_checkin_submissions`: `t`

Result: fixed (both enabled).

### q3: Policy coverage for remediated tables

Confirmed explicit CRUD policy coverage:
- `booking_groups`: SELECT/INSERT/UPDATE/DELETE = 1 each
- `property_photos`: SELECT/INSERT/UPDATE/DELETE = 1 each
- `pre_checkin_sessions`: SELECT/INSERT/UPDATE/DELETE = 1 each
- `pre_checkin_submissions`: SELECT/INSERT/UPDATE/DELETE = 1 each

### q2: RLS enabled but zero policies

`q2_rls_enabled_zero_policies.csv` still returns:
- `precheckin_sessions`

Interpretation:
- Legacy duplicate table (`precheckin_sessions` sem underscore) still has RLS enabled and no policies.
- This remains a governance mismatch and drift signal.

## Gate Status

- RLS Validation Gate: `BLOCKED`
  - Reason: at least one RLS-enabled table (`precheckin_sessions`) still has zero policies.
- Drift Re-validation Gate: `BLOCKED`
  - Reason: legacy duplicate table remains in inconsistent state (structural/policy drift not fully reconciled).

## Next Safe Remediation

Create a new idempotent forward migration to handle `public.precheckin_sessions` explicitly (choose one with GP approval):
1. Add explicit lock-down CRUD policies (`USING false` / `WITH CHECK false`) if table must remain inaccessible.
2. Or define proper tenant-scoped CRUD policies if table is still active domain.
3. Or deprecate/drop table by migration if confirmed obsolete.
