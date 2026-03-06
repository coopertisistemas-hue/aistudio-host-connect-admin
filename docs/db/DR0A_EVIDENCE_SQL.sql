-- DR0A Evidence SQL Pack (READ-ONLY)
-- Purpose: introspection-only evidence collection for Path A reconciliation.
-- Safety: no DDL, no DML, no temp objects.

-- ==========================================================
-- Q1: RLS enabled status for all public tables
-- ==========================================================
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
order by n.nspname, c.relname;

-- ==========================================================
-- Q2: Tables with RLS enabled but zero policies
-- ==========================================================
with public_tables as (
  select
    c.relname as table_name,
    c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
)
select
  t.table_name
from public_tables t
left join pg_policies p
  on p.schemaname = 'public'
 and p.tablename = t.table_name
where t.rls_enabled = true
group by t.table_name
having count(p.policyname) = 0
order by t.table_name;

-- ==========================================================
-- Q3: Policy counts by table and command
-- ==========================================================
select
  p.schemaname,
  p.tablename,
  p.cmd,
  count(*) as policy_count
from pg_policies p
where p.schemaname = 'public'
group by p.schemaname, p.tablename, p.cmd
order by p.tablename, p.cmd;

-- ==========================================================
-- Q4: Existence checks for booking_groups and property_photos
-- ==========================================================
select
  t.table_schema,
  t.table_name
from information_schema.tables t
where t.table_schema = 'public'
  and t.table_name in ('booking_groups', 'property_photos')
order by t.table_name;

-- ==========================================================
-- Q5: Index inventory (deterministic)
-- ==========================================================
select
  n.nspname as schema_name,
  t.relname as table_name,
  i.relname as index_name,
  pg_get_indexdef(ix.indexrelid) as index_definition
from pg_class t
join pg_index ix on ix.indrelid = t.oid
join pg_class i on i.oid = ix.indexrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relkind = 'r'
order by n.nspname, t.relname, i.relname;

-- ==========================================================
-- Q6: Trigger inventory (deterministic)
-- ==========================================================
select
  trg.trigger_schema,
  trg.event_object_table as table_name,
  trg.trigger_name,
  trg.action_timing,
  trg.event_manipulation
from information_schema.triggers trg
where trg.trigger_schema = 'public'
order by trg.trigger_schema, trg.event_object_table, trg.trigger_name, trg.event_manipulation;

-- ==========================================================
-- Q7: Function signature inventory (public)
-- ==========================================================
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as function_args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by n.nspname, p.proname, pg_get_function_identity_arguments(p.oid);

-- ==========================================================
-- Q8 (optional): diff-friendly table fingerprint summary
-- ==========================================================
with table_cols as (
  select
    c.table_schema,
    c.table_name,
    string_agg(
      c.column_name || ':' || c.data_type || ':' || coalesce(c.is_nullable, ''),
      ',' order by c.ordinal_position
    ) as col_fingerprint
  from information_schema.columns c
  where c.table_schema = 'public'
  group by c.table_schema, c.table_name
)
select
  table_schema,
  table_name,
  md5(col_fingerprint) as column_fingerprint_md5
from table_cols
order by table_schema, table_name;

