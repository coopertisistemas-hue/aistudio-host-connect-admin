param(
  [string]$SqlFile = "scripts/sql/rls_gate_check.sql"
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

$dbUrl = $env:DR0A_PGURL
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  $dbUrl = $env:DATABASE_URL
}
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  throw "Missing connection string. Set DR0A_PGURL or DATABASE_URL."
}

# Query A from rls_gate_check.sql (same semantics as DR0A q2 logic)
$gateSql = @"
WITH public_tables AS (
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
),
policy_counts AS (
  SELECT p.tablename AS table_name, COUNT(*)::int AS policy_count
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  GROUP BY p.tablename
)
SELECT t.table_name, COALESCE(pc.policy_count, 0) AS policy_count
FROM public_tables t
LEFT JOIN policy_counts pc ON pc.table_name = t.table_name
WHERE t.rls_enabled = true
  AND COALESCE(pc.policy_count, 0) = 0
ORDER BY t.table_name;
"@

Write-Host "Running RLS gate check (Query A)..."
$gateRows = & psql --no-psqlrc -X -v ON_ERROR_STOP=1 -P pager=off -d $dbUrl -At -F "," -c $gateSql
if ($LASTEXITCODE -ne 0) {
  throw "Failed to execute gate query."
}

if ($gateRows) {
  Write-Host "RLS gate FAILED. RLS-enabled tables with zero policies:"
  $gateRows | ForEach-Object { Write-Host " - $_" }
  Write-Host "`nDebug inventory (Query B from $SqlFile):"
  & psql --no-psqlrc -X -v ON_ERROR_STOP=1 -P pager=off -d $dbUrl -f $SqlFile
  exit 1
}

Write-Host "RLS gate PASS. No RLS-enabled table with zero policies."
Write-Host "`nDebug inventory (Query B from $SqlFile):"
& psql --no-psqlrc -X -v ON_ERROR_STOP=1 -P pager=off -d $dbUrl -f $SqlFile
if ($LASTEXITCODE -ne 0) {
  throw "Failed to execute debug query output."
}

