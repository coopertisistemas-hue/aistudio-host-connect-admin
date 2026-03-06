# SP25 UPH Config Pack (Pilot Readiness)

## 1. Pilot Scope
- Pilot tenant: UPH (single org scope for monitored go-live).
- Environment target: linked STAGING/PRD candidate conforme governanca GP.
- Feature scope: operacao front-desk, reservas, faturamento baseline, gates de integridade ativos.

## 2. Hard Gates (Must PASS)
- RLS gate (`scripts/ci/run_rls_gate_check.ps1`)
- Structural drift gate (`scripts/ci/run_structural_drift_gate.ps1`)
- Tenant contract gate (`scripts/ci/run_tenant_contract_gate.ps1`)
- Migration naming gate (`scripts/ci/check_migration_naming.ps1`)

## 3. Operational Preconditions
- Credenciais em variaveis de ambiente (nao versionadas).
- Supabase CLI autenticado e projeto corretamente vinculado.
- Ultimo sprint de seguranca/DR com PASS (Phases 8 e 9).

## 4. Pilot Command Pack
```powershell
supabase --version
supabase migration list --linked
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/ci/run_rls_gate_check.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/ci/run_structural_drift_gate.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/ci/run_tenant_contract_gate.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/ci/check_migration_naming.ps1"
```

## 5. Go/No-Go Criteria (SP25)
- GO: todos os gates PASS + build/typecheck/lint changed PASS + evidencias completas.
- NO-GO: qualquer gate FAIL/BLOCKED ou evidencia incompleta.

## 6. Output Artifacts
- `docs/qa/SP25/sql/*.log`
- `docs/qa/SP25/build.log`
- `docs/qa/SP25/typecheck.log`
- `docs/qa/SP25/lint_changed_files.log`
- `docs/qa/SP25/SP25_REPORT.md`
