param(
  [string]$MigrationsDir = "supabase/migrations"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $MigrationsDir)) {
  throw "Migrations directory not found: $MigrationsDir"
}

$canonicalPattern = '^\d{14}_[A-Za-z0-9_-]+\.sql$'
$rollbackPattern = '^ROLLBACK_.*\.sql$'

$files = Get-ChildItem -Path $MigrationsDir -File -Filter *.sql | Sort-Object Name
$offenders = New-Object System.Collections.Generic.List[string]
$rollbackOffenders = New-Object System.Collections.Generic.List[string]

foreach ($f in $files) {
  $name = $f.Name
  if ($name -match $canonicalPattern) {
    continue
  }
  if ($name -match $rollbackPattern) {
    $rollbackOffenders.Add($name) | Out-Null
    continue
  }
  $offenders.Add($name) | Out-Null
}

if ($offenders.Count -eq 0 -and $rollbackOffenders.Count -eq 0) {
  Write-Host "Migration naming gate PASS. All migration files are canonical."
  exit 0
}

Write-Host "Migration naming gate FAILED."
if ($offenders.Count -gt 0) {
  Write-Host "Non-canonical forward migration filenames:"
  $offenders | ForEach-Object { Write-Host " - $_" }
}

if ($rollbackOffenders.Count -gt 0) {
  Write-Host "Rollback scripts found in apply-chain directory (must be excluded from supabase/migrations):"
  $rollbackOffenders | ForEach-Object { Write-Host " - $_" }
}

exit 1

