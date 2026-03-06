# DB Validation Snapshot (SP0)

Source evidence package (DR0-A PASS):
- `docs/db/evidence/DR0A/20260301_042722_UTC/02_precheckin_sessions_readonly_checks.txt`
- `docs/db/evidence/DR0A/20260301_042722_UTC/csv/q1_rls_enabled_status.csv`
- `docs/db/evidence/DR0A/20260301_042722_UTC/csv/q3_policy_counts.csv`

Copied for SP0 QA:
- `docs/qa/SP0/sql/01_precheckin_sessions_readonly_checks.txt`
- `docs/qa/SP0/sql/02_q1_rls_enabled_status.csv`
- `docs/qa/SP0/sql/03_q3_policy_counts.csv`

## Query 1: org_id column existence
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public'
  AND table_name='precheckin_sessions'
  AND column_name='org_id';
```
Result snapshot:
```text
column_name | data_type | is_nullable
org_id      | uuid      | NO
```

## Query 2: RLS status
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname='public'
  AND tablename='precheckin_sessions';
```
Result snapshot (equivalent collector output):
```text
public,precheckin_sessions,t
```

## Query 3: policies
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename='precheckin_sessions';
```
Result snapshot (collector policy counts):
```text
public,precheckin_sessions,DELETE,1
public,precheckin_sessions,INSERT,1
public,precheckin_sessions,SELECT,1
public,precheckin_sessions,UPDATE,1
```

Note:
- This SP0 folder stores immutable evidence copied from the final DR0-A PASS collection timestamp `20260301_042722_UTC`.
