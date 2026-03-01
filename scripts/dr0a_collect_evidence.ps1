param(
  [string]$Timestamp = "",
  [string]$ConnectionEnvVar = "DR0A_PGURL"
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

$repoRoot = Split-Path -Parent $PSScriptRoot
$sqlFile = Join-Path $repoRoot "docs/db/DR0A_EVIDENCE_SQL.sql"
if (-not (Test-Path $sqlFile)) {
  throw "SQL file not found: $sqlFile"
}

$pgUrl = [Environment]::GetEnvironmentVariable($ConnectionEnvVar)
if ([string]::IsNullOrWhiteSpace($pgUrl)) {
  throw "Missing environment variable '$ConnectionEnvVar'. Set it to a PostgreSQL connection string before running."
}

if ([string]::IsNullOrWhiteSpace($Timestamp)) {
  $Timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd_HHmmss_UTC")
}

$baseOut = Join-Path $repoRoot "docs/db/evidence/DR0A/$Timestamp"
$csvOut = Join-Path $baseOut "csv"
New-Item -ItemType Directory -Force -Path $baseOut | Out-Null
New-Item -ItemType Directory -Force -Path $csvOut | Out-Null

$preflightFile = Join-Path $baseOut "00_preflight.txt"
$textOutFile = Join-Path $baseOut "05_evidence_text.txt"
$logFile = Join-Path $baseOut "dr0a_collect_evidence.log"

$utcNow = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss 'UTC'")
"timestamp_utc=$utcNow" | Out-File -FilePath $preflightFile -Encoding utf8
"connection_env_var=$ConnectionEnvVar" | Out-File -FilePath $preflightFile -Append -Encoding utf8
"sql_file=$sqlFile" | Out-File -FilePath $preflightFile -Append -Encoding utf8

function Invoke-PsqlFile {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [Parameter(Mandatory = $true)][string]$OutPath
  )

  $args = @(
    "--no-psqlrc",
    "-X",
    "-v", "ON_ERROR_STOP=1",
    "-P", "pager=off",
    "-d", $pgUrl,
    "-f", $FilePath
  )

  & psql @args 2>&1 | Tee-Object -FilePath $OutPath | Tee-Object -FilePath $logFile -Append | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "psql failed while executing file: $FilePath"
  }
}

function Invoke-PsqlCsvQuery {
  param(
    [Parameter(Mandatory = $true)][string]$Sql,
    [Parameter(Mandatory = $true)][string]$OutCsv
  )

  $args = @(
    "--no-psqlrc",
    "-X",
    "-v", "ON_ERROR_STOP=1",
    "-P", "pager=off",
    "-d", $pgUrl,
    "-At",
    "-F", ",",
    "-c", $Sql
  )

  & psql @args 2>&1 | Out-File -FilePath $OutCsv -Encoding utf8
  if ($LASTEXITCODE -ne 0) {
    throw "psql failed while collecting CSV: $OutCsv"
  }
}

# 1) Full text evidence output from shared SQL file
Invoke-PsqlFile -FilePath $sqlFile -OutPath $textOutFile

# 2) CSV extracts for diff-friendly review
$queries = @(
  @{
    name = "q1_rls_enabled_status.csv";
    sql  = "select n.nspname as schema_name,c.relname as table_name,c.relrowsecurity as rls_enabled from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' order by n.nspname,c.relname;";
  },
  @{
    name = "q2_rls_enabled_zero_policies.csv";
    sql  = "with public_tables as (select c.relname as table_name,c.relrowsecurity as rls_enabled from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r') select t.table_name from public_tables t left join pg_policies p on p.schemaname='public' and p.tablename=t.table_name where t.rls_enabled=true group by t.table_name having count(p.policyname)=0 order by t.table_name;";
  },
  @{
    name = "q3_policy_counts.csv";
    sql  = "select p.schemaname,p.tablename,p.cmd,count(*) as policy_count from pg_policies p where p.schemaname='public' group by p.schemaname,p.tablename,p.cmd order by p.tablename,p.cmd;";
  },
  @{
    name = "q4_critical_tables.csv";
    sql  = "select t.table_schema,t.table_name from information_schema.tables t where t.table_schema='public' and t.table_name in ('booking_groups','property_photos') order by t.table_name;";
  },
  @{
    name = "q5_index_inventory.csv";
    sql  = "select n.nspname as schema_name,t.relname as table_name,i.relname as index_name,pg_get_indexdef(ix.indexrelid) as index_definition from pg_class t join pg_index ix on ix.indrelid=t.oid join pg_class i on i.oid=ix.indexrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relkind='r' order by n.nspname,t.relname,i.relname;";
  },
  @{
    name = "q6_trigger_inventory.csv";
    sql  = "select trg.trigger_schema,trg.event_object_table as table_name,trg.trigger_name,trg.action_timing,trg.event_manipulation from information_schema.triggers trg where trg.trigger_schema='public' order by trg.trigger_schema,trg.event_object_table,trg.trigger_name,trg.event_manipulation;";
  },
  @{
    name = "q7_function_signatures.csv";
    sql  = "select n.nspname as schema_name,p.proname as function_name,pg_get_function_identity_arguments(p.oid) as function_args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid);";
  },
  @{
    name = "q8_table_fingerprints.csv";
    sql  = "with table_cols as (select c.table_schema,c.table_name,string_agg(c.column_name||':'||c.data_type||':'||coalesce(c.is_nullable,''),',' order by c.ordinal_position) as col_fingerprint from information_schema.columns c where c.table_schema='public' group by c.table_schema,c.table_name) select table_schema,table_name,md5(col_fingerprint) as column_fingerprint_md5 from table_cols order by table_schema,table_name;";
  }
)

foreach ($q in $queries) {
  $outPath = Join-Path $csvOut $q.name
  Invoke-PsqlCsvQuery -Sql $q.sql -OutCsv $outPath
}

"SUCCESS: DR0A evidence collected at $baseOut" | Tee-Object -FilePath $logFile -Append

