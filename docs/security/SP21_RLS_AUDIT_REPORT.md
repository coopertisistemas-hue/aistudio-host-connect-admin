# SP21 - Full RLS Audit & Least Privilege Report

## Scope
- Revalidar isolamento tenant-first com gates de RLS, tenant contract e structural drift.
- Consolidar matriz de risco para caminhos de vazamento entre tenants.
- Documentar postura de least privilege operacional para papeis de usuario e de pipeline.

## Evidence Inputs
- `docs/qa/SP21/sql/rls_gate.log`
- `docs/qa/SP21/sql/tenant_contract_gate.log`
- `docs/qa/SP21/sql/structural_drift_gate.log`
- `docs/qa/SP21/sql/migration_naming_gate.log`

## Risk Matrix (Current)
| Risk ID | Scenario | Severity | Current Control | Status |
|---|---|---|---|---|
| RLS-01 | Tabela publica com RLS habilitada e zero policies | P0 | `run_rls_gate_check.ps1` + CI gate | Mitigated |
| RLS-02 | Tabela RLS sem `org_id` (fora da allowlist) | P0 | `run_tenant_contract_gate.ps1` Query A | Mitigated |
| RLS-03 | Policy sem referencia a `org_id` | P1 | `run_tenant_contract_gate.ps1` Query B (warn-mode) | Controlled |
| DRIFT-01 | Alteracao estrutural fora do baseline | P1 | `run_structural_drift_gate.ps1` | Mitigated |
| MIG-01 | Nomeacao nao canonica em migrations | P1 | `check_migration_naming.ps1` | Mitigated |

## RLS Audit Verdict
Sem evidencia de regressao de isolamento tenant nas verificacoes executadas na SP21.

## Required Follow-up (SP22)
- Confirmar inventario de segredos e ownership por ambiente.
- Endurecer fluxo de scan para vazamento de segredos em docs/scripts/logs.
