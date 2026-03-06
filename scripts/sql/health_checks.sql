\pset pager off

-- SP20 health checks (read-only): deterministic check list.
SELECT 'hc_01_connection' AS check_name,
       'PASS' AS status,
       current_database() AS details
UNION ALL
SELECT 'hc_02_user',
       'PASS',
       current_user
UNION ALL
SELECT 'hc_03_recovery_mode',
       CASE WHEN pg_is_in_recovery() THEN 'FAIL' ELSE 'PASS' END,
       CASE WHEN pg_is_in_recovery() THEN 'replica_mode' ELSE 'primary_mode' END
UNION ALL
SELECT 'hc_04_table_organizations',
       CASE WHEN to_regclass('public.organizations') IS NULL THEN 'FAIL' ELSE 'PASS' END,
       COALESCE(to_regclass('public.organizations')::text, 'missing')
UNION ALL
SELECT 'hc_05_table_properties',
       CASE WHEN to_regclass('public.properties') IS NULL THEN 'FAIL' ELSE 'PASS' END,
       COALESCE(to_regclass('public.properties')::text, 'missing')
UNION ALL
SELECT 'hc_06_table_bookings',
       CASE WHEN to_regclass('public.bookings') IS NULL THEN 'FAIL' ELSE 'PASS' END,
       COALESCE(to_regclass('public.bookings')::text, 'missing')
UNION ALL
SELECT 'hc_07_table_invoices',
       CASE WHEN to_regclass('public.invoices') IS NULL THEN 'FAIL' ELSE 'PASS' END,
       COALESCE(to_regclass('public.invoices')::text, 'missing')
UNION ALL
SELECT 'hc_08_table_profiles',
       CASE WHEN to_regclass('public.profiles') IS NULL THEN 'FAIL' ELSE 'PASS' END,
       COALESCE(to_regclass('public.profiles')::text, 'missing')
ORDER BY check_name;

-- Supporting snapshot for rapid triage.
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('organizations', 'properties', 'bookings', 'invoices', 'profiles')
ORDER BY tablename;

