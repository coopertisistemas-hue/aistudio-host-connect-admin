param(
  [string]$OutputPath = "docs/qa/SP20/ops/health_checks.log"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$env:PGCLIENTENCODING = "UTF8"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$sqlPath = Join-Path $repoRoot "scripts\sql\health_checks.sql"
$outputFull = Join-Path $repoRoot $OutputPath
$outputDir = Split-Path $outputFull -Parent

if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

if (-not (Test-Path $sqlPath)) {
  throw "health_checks.sql not found at $sqlPath"
}

$dbUrl = $env:DATABASE_URL
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  $dbUrl = $env:DR0A_PGURL
}
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  throw "DATABASE_URL or DR0A_PGURL must be set."
}

"SP20 health checks started at $([DateTime]::UtcNow.ToString('yyyy-MM-dd HH:mm:ss UTC'))" | Set-Content -Path $outputFull -Encoding UTF8

& psql "$dbUrl" -v ON_ERROR_STOP=1 -P pager=off -f "$sqlPath" 2>&1 | Tee-Object -FilePath $outputFull -Append | Out-Null

$failCount = (& psql "$dbUrl" -v ON_ERROR_STOP=1 -P pager=off -At -c @"
WITH checks AS (
  SELECT CASE WHEN pg_is_in_recovery() THEN 'FAIL' ELSE 'PASS' END AS status
  UNION ALL
  SELECT CASE WHEN to_regclass('public.organizations') IS NULL THEN 'FAIL' ELSE 'PASS' END
  UNION ALL
  SELECT CASE WHEN to_regclass('public.properties') IS NULL THEN 'FAIL' ELSE 'PASS' END
  UNION ALL
  SELECT CASE WHEN to_regclass('public.bookings') IS NULL THEN 'FAIL' ELSE 'PASS' END
  UNION ALL
  SELECT CASE WHEN to_regclass('public.invoices') IS NULL THEN 'FAIL' ELSE 'PASS' END
  UNION ALL
  SELECT CASE WHEN to_regclass('public.profiles') IS NULL THEN 'FAIL' ELSE 'PASS' END
)
SELECT count(*) FROM checks WHERE status = 'FAIL';
"@).Trim()

if ($failCount -ne "0") {
  throw "Health checks failed with $failCount failing checks."
}

Write-Host "Health checks PASS. Output: $outputFull"

