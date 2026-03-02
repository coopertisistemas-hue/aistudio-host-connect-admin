-- SP1-D Multi-Tenant Contract Check (read-only)
-- Query A (FAIL): RLS-enabled public tables missing org_id (unless allowlisted)
-- Query B (WARN/optional FAIL): RLS+org_id tables with policies that do not reference org_id
-- Query C (DEBUG): inventory of public tables with rls_enabled, has_org_id, policy_count
--
-- NOTE:
-- Keep allowlists in this file and scripts/ci/run_tenant_contract_gate.ps1 in sync.

-- ==========================================================
-- Query A: FAIL candidates (RLS enabled + missing org_id)
-- ==========================================================
WITH allowlist_missing_org_id(table_name, rationale) AS (
  VALUES
    ('audit_log', 'global audit trail; scoped by actor/target context'),
    ('booking_charges', 'scoped through booking_id relationship'),
    ('departments', 'legacy property-scoped module pending full org_id migration'),
    ('entity_photos', 'legacy media helper; scoped by parent entity'),
    ('expenses', 'legacy property-scoped module pending full org_id migration'),
    ('faqs', 'public marketing content'),
    ('features', 'public marketing content'),
    ('hostconnect_staff', 'legacy global staff table pending org_id migration'),
    ('how_it_works_steps', 'public marketing content'),
    ('idea_comments', 'legacy ideation module pending full org_id migration'),
    ('integrations', 'public/informational catalog'),
    ('invoices', 'legacy finance module pending full org_id migration'),
    ('lead_timeline_events', 'legacy CRM module pending full org_id migration'),
    ('notifications', 'user-scoped notifications'),
    ('organizations', 'tenant root table; tenant identity source without org_id column'),
    ('pricing_plans', 'public pricing catalog'),
    ('profiles', 'user profile table scoped by user_id/auth.uid()'),
    ('reservation_leads', 'legacy CRM module pending full org_id migration'),
    ('reservation_quotes', 'legacy CRM module pending full org_id migration'),
    ('shift_assignments', 'legacy property-scoped module pending full org_id migration'),
    ('shift_handoffs', 'legacy property-scoped module pending full org_id migration'),
    ('shifts', 'legacy property-scoped module pending full org_id migration'),
    ('staff_profiles', 'legacy staff profile module pending full org_id migration'),
    ('stock_check_items', 'legacy stock module pending full org_id migration'),
    ('stock_daily_checks', 'legacy stock module pending full org_id migration'),
    ('stock_items', 'legacy stock module pending full org_id migration'),
    ('stock_locations', 'legacy stock module pending full org_id migration'),
    ('stock_movements', 'legacy stock module pending full org_id migration'),
    ('tasks', 'legacy operations module pending full org_id migration'),
    ('testimonials', 'public marketing content')
    ,('ticket_comments', 'legacy support module pending full org_id migration')
),
public_tables AS (
  SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
),
org_columns AS (
  SELECT
    c.table_name,
    c.data_type
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name = 'org_id'
)
SELECT
  t.table_name,
  'missing org_id on RLS-enabled table' AS issue
FROM public_tables t
LEFT JOIN org_columns oc ON oc.table_name = t.table_name
LEFT JOIN allowlist_missing_org_id a ON a.table_name = t.table_name
WHERE t.rls_enabled = true
  AND oc.table_name IS NULL
  AND a.table_name IS NULL
ORDER BY t.table_name;

-- ==========================================================
-- Query B: WARN candidates (RLS + org_id, policies lacking org_id text)
-- ==========================================================
WITH allowlist_policy_orgid(table_name, rationale) AS (
  VALUES
    ('booking_charges', 'scoped through booking relationship policy patterns')
),
rls_with_org AS (
  SELECT
    c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN information_schema.columns ic
    ON ic.table_schema = n.nspname
   AND ic.table_name = c.relname
   AND ic.column_name = 'org_id'
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
),
policy_stats AS (
  SELECT
    p.tablename AS table_name,
    COUNT(*)::int AS policy_count,
    COUNT(*) FILTER (
      WHERE (
        COALESCE(p.qual, '') || ' ' || COALESCE(p.with_check, '')
      ) ILIKE '%org_id%'
    )::int AS policies_with_org_id_ref
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  GROUP BY p.tablename
)
SELECT
  t.table_name,
  COALESCE(ps.policy_count, 0) AS policy_count,
  COALESCE(ps.policies_with_org_id_ref, 0) AS policies_with_org_id_ref,
  'org_id policy reference not detected' AS issue
FROM rls_with_org t
LEFT JOIN policy_stats ps ON ps.table_name = t.table_name
LEFT JOIN allowlist_policy_orgid a ON a.table_name = t.table_name
WHERE COALESCE(ps.policy_count, 0) > 0
  AND COALESCE(ps.policies_with_org_id_ref, 0) = 0
  AND a.table_name IS NULL
ORDER BY t.table_name;

-- ==========================================================
-- Query C: DEBUG inventory
-- ==========================================================
WITH public_tables AS (
  SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
),
org_columns AS (
  SELECT
    c.table_name,
    true AS has_org_id
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.column_name = 'org_id'
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
  t.rls_enabled,
  COALESCE(o.has_org_id, false) AS has_org_id,
  COALESCE(pc.policy_count, 0) AS policy_count
FROM public_tables t
LEFT JOIN org_columns o ON o.table_name = t.table_name
LEFT JOIN policy_counts pc ON pc.table_name = t.table_name
ORDER BY t.table_name;
