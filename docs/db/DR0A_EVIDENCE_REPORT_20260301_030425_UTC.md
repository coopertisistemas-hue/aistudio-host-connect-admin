# DR0-A Evidence Report - 20260301_030425_UTC

## Status

- Result: `COLLECTED_WITH_FINDINGS`
- Safety: read-only evidence collection only; no migration/apply/reset/write command executed.
- Collector outcome: `SUCCESS`

## What Was Executed

Commands executed by operator:

```cmd
set "TS=20260301_030425_UTC"
set "DR0A_PGURL=postgresql://postgres.oravqykjpgqoiidqnfja@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
set /p PGPASSWORD=Enter PGPASSWORD:
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/dr0a_collect_evidence.ps1" -Timestamp "%TS%"
```

Verification commands executed:

```cmd
powershell -NoProfile -Command "Get-Content 'docs/db/evidence/DR0A/%TS%/dr0a_collect_evidence.log' -Tail 40"
powershell -NoProfile -Command "(Get-Content 'docs/db/evidence/DR0A/%TS%/05_evidence_text.txt' -TotalCount 1); (Get-Content 'docs/db/evidence/DR0A/%TS%/05_evidence_text.txt' -Tail 1); (Get-Content 'docs/db/evidence/DR0A/%TS%/05_evidence_text.txt' | Measure-Object -Line).Lines"
dir /b "docs\db\evidence\DR0A\%TS%\csv"
```

## Evidence Paths

- Root: `docs/db/evidence/DR0A/20260301_030425_UTC/`
- Required artifacts present:
  - `00_preflight.txt`
  - `05_evidence_text.txt`
  - `dr0a_collect_evidence.log`
  - `csv/q1_rls_enabled_status.csv`
  - `csv/q2_rls_enabled_zero_policies.csv`
  - `csv/q3_policy_counts.csv`
  - `csv/q4_critical_tables.csv`
  - `csv/q5_index_inventory.csv`
  - `csv/q6_trigger_inventory.csv`
  - `csv/q7_function_signatures.csv`
  - `csv/q8_table_fingerprints.csv`

## Quick Findings

### 1) Critical tables existence (q4)

- `q4_critical_tables.csv` is empty.
- Finding: `booking_groups` and `property_photos` are not present in `public`.

### 2) RLS enabled but zero policies (q2)

Tables returned:
- `departments`
- `hostconnect_staff`
- `lead_timeline_events`
- `reservation_leads`
- `reservation_quotes`
- `shift_assignments`
- `shift_handoffs`
- `shifts`
- `staff_profiles`
- `stock_check_items`
- `stock_daily_checks`
- `stock_items`
- `stock_locations`
- `stock_movements`

### 3) Obvious RLS/policy anomalies (q1 + q3)

- RLS disabled (`rls_enabled = f`) on:
  - `pre_checkin_sessions`
  - `pre_checkin_submissions`
- Policy coverage appears partial on several tables (examples):
  - `audit_log`: only `SELECT`
  - `booking_guests`: only `SELECT`
  - `precheckin_sessions`: only `SELECT`
- Multiple tables rely on mixed `ALL` plus command-specific policies, indicating policy model divergence that still requires reconciliation review.

## Gate Status

- RLS Validation Gate: `BLOCKED`
  - Reasons:
    - RLS disabled on `pre_checkin_sessions` and `pre_checkin_submissions`.
    - 14 RLS-enabled tables with zero policies.
- Drift Re-validation Gate: `BLOCKED`
  - Reasons:
    - `booking_groups` missing.
    - `property_photos` missing.
    - Material authorization/model drift still present.

## Conclusion

DR0-A evidence collection is complete and reproducible for timestamp `20260301_030425_UTC`, but current STAGING state does not satisfy Path A acceptance gates.
