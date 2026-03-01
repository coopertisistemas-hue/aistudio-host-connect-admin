param(
  [string]$SqlFile = "scripts/sql/structural_fingerprint.sql",
  [string]$BaselineFile = "docs/db/baselines/SP1B_baseline/structural_fingerprint.csv"
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
if (-not (Test-Path $BaselineFile)) {
  throw "Baseline file not found: $BaselineFile"
}

$dbUrl = $env:DATABASE_URL
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  $dbUrl = $env:DR0A_PGURL
}
if ([string]::IsNullOrWhiteSpace($dbUrl)) {
  throw "Missing connection string. Set DATABASE_URL or DR0A_PGURL."
}

# Enforce deterministic UTF-8 handling to avoid false-positive diffs (mojibake).
$env:PGCLIENTENCODING = "UTF8"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

$tmpFile = [System.IO.Path]::GetTempFileName()
try {
  $currentRaw = & psql --no-psqlrc -X -v ON_ERROR_STOP=1 -P pager=off -d $dbUrl --csv -f $SqlFile
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to generate current structural fingerprint."
  }
  Set-Content -Path $tmpFile -Value $currentRaw -Encoding utf8

  $baseline = Get-Content -Path $BaselineFile -Encoding utf8
  $current = Get-Content -Path $tmpFile -Encoding utf8

  $diff = Compare-Object -ReferenceObject $baseline -DifferenceObject $current
  if (-not $diff) {
    Write-Host "Structural drift gate PASS. Fingerprint matches baseline."
    exit 0
  }

  Write-Host "Structural drift gate FAILED. Fingerprint differs from baseline."
  $removed = @($diff | Where-Object { $_.SideIndicator -eq '<=' } | Select-Object -ExpandProperty InputObject)
  $added = @($diff | Where-Object { $_.SideIndicator -eq '=>' } | Select-Object -ExpandProperty InputObject)

  Write-Host ""
  Write-Host "Removed lines (baseline only):"
  if ($removed.Count -eq 0) { Write-Host " - none" } else { $removed | ForEach-Object { Write-Host " - $_" } }

  Write-Host ""
  Write-Host "Added lines (current only):"
  if ($added.Count -eq 0) { Write-Host " - none" } else { $added | ForEach-Object { Write-Host " - $_" } }

  exit 1
}
finally {
  if (Test-Path $tmpFile) {
    Remove-Item $tmpFile -Force -ErrorAction SilentlyContinue
  }
}
