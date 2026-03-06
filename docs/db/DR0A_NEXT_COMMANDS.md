# DR0-A Next Commands (Post-Normalization)

Use these commands after migration filename normalization to verify CLI ordering and proceed with Path A flow.

## 1) Read-only prechecks

```powershell
supabase --version
supabase status
supabase migration list --linked
```

Expected:
- No `--include-all` prompt triggered by the 5 previously nonstandard migrations.
- Canonical files visible in local chain:
  - `20260119120000_sprint2_guest_domain_model.sql`
  - `20260120120000_sprint2_2_submissions.sql`
  - `20260121080000_hotfix_status_constraint.sql`
  - `20260121090000_housekeeping_foundation.sql`
  - `20260121100000_operational_alerts_tables.sql`

## 2) Push migration chain (DB write)

```powershell
supabase db push --linked
```

If this fails, stop and capture full output before retrying.

## 3) Collect DR0A evidence

```powershell
$ts = (Get-Date).ToUniversalTime().ToString('yyyyMMdd_HHmmss_UTC')
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/dr0a_collect_evidence.ps1" -Timestamp $ts
```

## 4) Verify evidence artifacts

```powershell
Get-ChildItem "docs/db/evidence/DR0A/$ts"
Get-ChildItem "docs/db/evidence/DR0A/$ts/csv"
```

## 5) Update report and gate decision

Update `docs/db/DR0A_EVIDENCE_REPORT_<timestamp>.md` with:
- db push status
- q1/q2/q4 findings
- final RLS Validation Gate and Drift Re-validation Gate status (`PASS` or `BLOCKED`)

