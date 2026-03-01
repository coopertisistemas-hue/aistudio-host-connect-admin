-- DR0-A RLS Regression Gate (read-only)
-- Query A (gate): tables in public schema with RLS enabled and zero policies.
-- Query B (debug): policy counts per public table for actionable logs.

-- Query A: gate failures (must return zero rows)
WITH public_tables AS (
  SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
),
policy_counts AS (
  SELECT
    p.tablename AS table_name,
    COUNT(*)::int AS policy_count
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  GROUP BY p.tablename
)
SELECT
  t.table_name,
  COALESCE(pc.policy_count, 0) AS policy_count
FROM public_tables t
LEFT JOIN policy_counts pc
  ON pc.table_name = t.table_name
WHERE t.rls_enabled = true
  AND COALESCE(pc.policy_count, 0) = 0
ORDER BY t.table_name;

-- Query B: debug inventory (deterministic)
SELECT
  t.table_name,
  t.rls_enabled,
  COALESCE(pc.policy_count, 0) AS policy_count
FROM (
  SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
) t
LEFT JOIN (
  SELECT
    p.tablename AS table_name,
    COUNT(*)::int AS policy_count
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  GROUP BY p.tablename
) pc
  ON pc.table_name = t.table_name
ORDER BY t.table_name;
