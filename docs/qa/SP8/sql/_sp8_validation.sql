\pset pager off
\echo [q1] sp8_table_exists
select schemaname, tablename from pg_tables where schemaname='public' and tablename='reservation_orchestration_events';
\echo [q2] sp8_rls_enabled
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' and c.relname='reservation_orchestration_events';
\echo [q3] sp8_policy_counts
select tablename, cmd, count(*) as policy_count
from pg_policies
where schemaname='public' and tablename='reservation_orchestration_events'
group by tablename, cmd
order by cmd;
\echo [q4] sp8_functions_exists
select routine_name
from information_schema.routines
where routine_schema='public'
  and routine_name in ('claim_reservation_orchestration_event','complete_reservation_orchestration_event')
order by routine_name;
