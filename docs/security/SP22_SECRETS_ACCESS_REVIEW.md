# SP22 - Secrets & Access Review

## Scope
- Validar modelo de manuseio de segredos em CI e runtime.
- Confirmar ausencia de segredos em texto claro em arquivos versionados no escopo de docs/scripts/src.
- Revisar fronteiras de privilegio para identidades de pipeline e operacao.

## Secrets Ownership Matrix
| Secret Class | Owner | Storage | Rotation Policy | Repo Policy |
|---|---|---|---|---|
| CI database read-only URL | GP/DevOps | CI secret store | Rotacao trimestral ou incidente | Nao versionar |
| DB password / token privilegiado | GP/DevOps | Secret manager | Rotacao imediata apos exposicao | Nao versionar |
| API integration tokens | Integrations owner | Secret manager | Rotacao por fornecedor | Nao versionar |

## Access Boundary Review
| Surface | Required privilege | Current status |
|---|---|---|
| CI gate scripts (`scripts/ci`) | Read-only DB access | PASS |
| Migration execution | GP controlled, linked project only | PASS |
| Local operator shell | Env vars em sessao temporaria | PASS |
| Repo tracked files | Sem segredo literal | Validado por scan SP22 |

## Enforcement Rules
- Proibido commit de `DATABASE_URL`, `DR0A_PGURL`, `PGPASSWORD`, tokens e chaves.
- Logs de QA devem conter somente placeholders ou valores redigidos.
- Qualquer incidente de segredo exige rotacao e registro em runbook de seguranca.

## SP22 Verdict
Consolidado apos execucao dos comandos de QA e scan de segredos em `docs/qa/SP22/`.
