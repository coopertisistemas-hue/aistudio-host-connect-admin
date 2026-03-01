param(
  [string]$SqlFile = "scripts/sql/tenant_contract_check.sql"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

Require-Command -Name "psql"

if (-not (Test-Path $SqlFile)) {
  throw "SQL file not found: $SqlFile"
}

$dbUrl = $env:DATABASE_URL
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  $dbUrl = $env:DR0A_PGURL
}
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  throw "Missing connection string. Set DATABASE_URL or DR0A_PGURL."
}

# Deterministic UTF-8 output
$env:PGCLIENTENCODING = "UTF8"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$strictPolicyRef = ($env:TENANT_CONTRACT_STRICT_POLICY_REF -eq "true")

# Query A (FAIL)
$queryA = @"
WITH allowlist_missing_org_id(table_name, rationale) AS (
  VALUES
    ('audit_log', 'global audit trail; scoped by actor/target context'),
    ('booking_charges', 'scoped through booking_id relationship'),
    ('entity_photos', 'legacy media helper; scoped by parent entity'),
    ('faqs', 'public marketing content'),
    ('features', 'public marketing content'),
    ('how_it_works_steps', 'public marketing content'),
    ('integrations', 'public/informational catalog'),
    ('invoices', 'legacy finance module pending full org_id migration'),
    ('lead_timeline_events', 'legacy CRM module pending full org_id migration'),
    ('notifications', 'user-scoped notifications'),
    ('pricing_plans', 'public pricing catalog'),
    ('testimonials', 'public marketing content')
),
public_tables AS (
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
),
org_columns AS (
  SELECT c.table_name
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.column_name = 'org_id'
)
SELECT t.table_name, 'missing org_id on RLS-enabled table' AS issue
FROM public_tables t
LEFT JOIN org_columns oc ON oc.table_name = t.table_name
LEFT JOIN allowlist_missing_org_id a ON a.table_name = t.table_name
WHERE t.rls_enabled = true
  AND oc.table_name IS NULL
  AND a.table_name IS NULL
ORDER BY t.table_name;
"@

# Query B (WARN by default; FAIL if strict mode)
$queryB = @"
WITH allowlist_policy_orgid(table_name, rationale) AS (
  VALUES
    ('booking_charges', 'scoped through booking relationship policy patterns')
),
rls_with_org AS (
  SELECT c.relname AS table_name
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
      WHERE (COALESCE(p.qual, '') || ' ' || COALESCE(p.with_check, '')) ILIKE '%org_id%'
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
"@

Write-Host "Running SP1-D Query A (FAIL condition)..."
$rowsA = & psql --no-psqlrc -X -v ON_ERROR_STOP=1 -P pager=off -d $dbUrl -At -F "," -c $queryA
if ($LASTEXITCODE -ne 0) {
  throw "Failed to execute Query A."
}

if ($rowsA) {
  Write-Host "Tenant contract gate FAILED (Query A). Offending tables:"
  $rowsA | ForEach-Object { Write-Host " - $_" }
  Write-Host "`nDebug inventory from ${SqlFile}:"
  & psql --no-psqlrc -X -v ON_ERROR_STOP=1 -P pager=off -d $dbUrl -f $SqlFile
  exit 1
}

Write-Host "SP1-D Query A PASS."

Write-Host "Running SP1-D Query B (org_id policy reference heuristic)..."
$rowsB = & psql --no-psqlrc -X -v ON_ERROR_STOP=1 -P pager=off -d $dbUrl -At -F "," -c $queryB
if ($LASTEXITCODE -ne 0) {
  throw "Failed to execute Query B."
}

if ($rowsB) {
  if ($strictPolicyRef) {
    Write-Host "Tenant contract gate FAILED (Query B strict mode). Offending tables:"
    $rowsB | ForEach-Object { Write-Host " - $_" }
    Write-Host "`nDebug inventory from ${SqlFile}:"
    & psql --no-psqlrc -X -v ON_ERROR_STOP=1 -P pager=off -d $dbUrl -f $SqlFile
    exit 1
  } else {
    Write-Host "Tenant contract gate WARN (Query B). Potential policy issues:"
    $rowsB | ForEach-Object { Write-Host " - $_" }
  }
} else {
  Write-Host "SP1-D Query B PASS (no warnings)."
}

Write-Host "`nDebug inventory from ${SqlFile}:"
& psql --no-psqlrc -X -v ON_ERROR_STOP=1 -P pager=off -d $dbUrl -f $SqlFile
if ($LASTEXITCODE -ne 0) {
  throw "Failed to execute debug inventory query."
}

Write-Host "Tenant contract gate completed."
