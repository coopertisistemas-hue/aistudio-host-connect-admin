# DR0 Execution Runbook (No-Op Planning Document)

Date: 2026-03-01  
Purpose: execution blueprint for drift reconciliation after GP approves SSOT path.  
Important: this document defines commands and checks only; it does not authorize execution by itself.

Governance references:
- `AI_RULES.md`
- `ai/CONNECT_GUARDRAILS.md`
- `ai/CONNECT_WORKFLOW.md`
- `ai/CONNECT_QA_GATES.md`

---

## 0) Global Preconditions

1. Confirm approved path: `A` (Repo SSOT) or `B` (STAGING SSOT) in writing from GP/Orchestrator.
2. Confirm environment target is STAGING only.
3. Confirm Supabase CLI link points to intended STAGING project.
4. Confirm no production operations are planned.
5. Confirm rollback strategy and evidence folder path.

STOP if any precondition is missing.

---

## 1) Shared STOP/GO Checks (applies to both paths)

### STOP checks
- Project ref mismatch (wrong Supabase project linked).
- Any migration contains non-idempotent destructive statements without approved rollback.
- RLS disabled on tenant tables after reconciliation.
- Cross-tenant negative tests fail.
- Integration contract checks fail.

### GO checks
- Migration Validation Gate: PASS
- RLS Validation Gate: PASS
- Smoke Test Gate: PASS
- Integration Contract Gate: PASS
- Evidence set complete and attached

---

## 2) Path A Runbook (Repo is SSOT)

### A.1 Preflight commands (read-only)

```bash
supabase --version
supabase status
cat supabase/.temp/project-ref
ls -1 supabase/migrations
```

```bash
# Local snapshot for evidence
supabase db dump --linked --schema public -f docs/db/evidence/DR0_A_before_public.sql
```

STOP if linked project is not approved STAGING.

### A.2 Rebuild/reconcile workflow

```bash
# Dry-run style checks first (if available in your setup)
supabase db lint
```

```bash
# Apply canonical migration chain to STAGING
supabase db push --linked
```

```bash
# Post-apply snapshot
supabase db dump --linked --schema public -f docs/db/evidence/DR0_A_after_public.sql
```

STOP if `db push` returns any migration or permission error.

### A.3 Exceptions handling (STAGING-only objects that GP keeps)

For each approved exception:
1. Create forward migration under `supabase/migrations/<timestamp>_...sql`
2. Add table DDL + indexes + RLS + CRUD policies + triggers/functions as needed
3. Re-run `supabase db push --linked`
4. Re-run SQL validation pack

STOP if any retained object lacks explicit RLS/policy model.

---

## 3) Path B Runbook (STAGING is SSOT)

### B.1 Preflight commands (read-only)

```bash
supabase --version
supabase status
cat supabase/.temp/project-ref
```

```bash
# Snapshot STAGING current state for reconciliation baseline
supabase db dump --linked --schema public -f docs/db/evidence/DR0_B_baseline_public.sql
```

### B.2 Backport workflow

1. Build approved object list from `DR0_DRIFT_INVENTORY.md` (all `DEFER` resolved to `DROP` or `BACKPORT`).
2. For every `BACKPORT` object, create forward migration(s) that reproduce STAGING behavior intentionally.
3. Normalize policy naming and ensure explicit CRUD coverage for tenant tables.
4. Remove/rewrite permissive policies not approved by GP/Security.

Command template:

```bash
# Iterate as migrations are added
supabase db push --linked
supabase db dump --linked --schema public -f docs/db/evidence/DR0_B_after_<milestone>.sql
```

STOP if any object is backported without policy tests and RLS verification.

---

## 4) Validation SQL Pack (run after each milestone)

Note: examples below are read-only introspection SQL.

### 4.1 RLS enabled status

```sql
select n.nspname as schema_name,
       c.relname as table_name,
       c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;
```

### 4.2 Policy inventory by table/command

```sql
select schemaname,
       tablename,
       cmd,
       count(*) as policy_count
from pg_policies
where schemaname = 'public'
group by schemaname, tablename, cmd
order by tablename, cmd;
```

### 4.3 Tables with RLS enabled but no policies

```sql
with public_tables as (
  select c.relname as table_name, c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
)
select p.table_name
from public_tables p
left join pg_policies pol
  on pol.schemaname = 'public'
 and pol.tablename = p.table_name
where p.rls_enabled = true
group by p.table_name
having count(pol.policyname) = 0
order by p.table_name;
```

### 4.4 Critical object existence checks

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('booking_groups', 'property_photos')
order by table_name;
```

### 4.5 Index coverage spot-check (tenant keys)

```sql
select
  t.relname as table_name,
  i.relname as index_name,
  pg_get_indexdef(ix.indexrelid) as index_def
from pg_class t
join pg_index ix on t.oid = ix.indrelid
join pg_class i on i.oid = ix.indexrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
order by t.relname, i.relname;
```

### 4.6 Trigger inventory

```sql
select event_object_table as table_name,
       trigger_name,
       action_timing,
       event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
```

### 4.7 Function signature inventory (public)

```sql
select n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;
```

---

## 5) QA Gate Evidence Checklist

Collect and attach:
1. CLI output logs:
   - `supabase db push --linked`
   - `supabase db dump --linked ...`
2. SQL outputs:
   - RLS status
   - Policy counts by command
   - Zero-policy RLS tables check
   - Critical table existence
   - Trigger/function inventories
3. Drift comparison artifact:
   - Before/after schema dumps
   - Diff summary markdown
4. Sign-off evidence:
   - DEV sign-off (Smoke + Migration)
   - Orchestrator sign-off (Migration)
   - Security review (RLS)
   - QA sign-off (Integration Contract)

---

## 6) Path-Specific Acceptance Criteria

### Path A acceptance
- STAGING schema can be reconstructed from repo migrations without manual SQL.
- No unresolved extra STAGING objects unless explicitly backported by approved migration.
- `booking_groups` and `property_photos` state resolved per approved target model.

### Path B acceptance
- All retained STAGING-only objects represented in reviewed migrations.
- Policy model normalized and validated for tenant isolation.
- All `DEFER` decisions converted to `DROP` or `BACKPORT` with GP approval.

---

## 7) Final GO/NO-GO Template

- Environment gate: `PASS/FAIL`
- Migration gate: `PASS/FAIL`
- RLS gate: `PASS/FAIL`
- Integration contract gate: `PASS/FAIL`
- Residual risk accepted by GP: `YES/NO`
- Final decision: `GO` only if all required gates are `PASS`.
