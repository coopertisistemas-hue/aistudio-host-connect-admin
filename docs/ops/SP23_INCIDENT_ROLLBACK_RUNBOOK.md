# SP23 Incident & Rollback Runbook

## 1. Purpose
Padronizar resposta a incidente e rollback controlado para app + banco, com trilha auditavel e sem hotfix manual fora de governanca.

## 2. Severity and Ownership
| Severity | Definition | Initial Owner | Escalation |
|---|---|---|---|
| SEV0 | indisponibilidade total, risco de dados | GP + Orchestrator | imediato, war room |
| SEV1 | degradacao critica de operacao principal | GP | escalonar <= 15 min |
| SEV2 | impacto parcial com workaround | DEV on-duty | escalonar <= 30 min |
| SEV3 | impacto baixo/localizado | DEV on-duty | tratar no ciclo normal |

## 3. First 15 Minutes Checklist
1. Confirmar escopo (tenant(s), modulo, ambiente).
2. Congelar mudancas nao emergenciais.
3. Coletar evidencias iniciais (`supabase migration list --linked`, logs CI, status app).
4. Classificar severidade e abrir canal de incidente.
5. Definir acao: mitigacao rapida ou rollback.

## 4. Rollback Decision Tree
1. Mudanca em app sem migration?
   - Reverter commit e redeploy controlado.
2. Mudanca com migration aplicada?
   - Nao executar SQL manual em dashboard.
   - Aplicar migration forward compensatoria (se necessario) com aprovacao GP.
3. Gate de seguranca falhou (RLS/tenant/drift)?
   - Bloquear release, restaurar ultimo estado conhecido PASS.

## 5. Command Pack (Dry-Run / Read-Only)
```powershell
supabase --version
supabase migration list --linked
git status -sb
git rev-parse --short HEAD
```

## 6. Rollback Validation After Action
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `pnpm exec eslint <changed-files>`
- (se DB tocado) gates: RLS + structural drift + tenant contract + migration naming

## 7. Communication Protocol
- Atualizacao inicial: ate 10 min apos classificacao.
- Atualizacoes recorrentes: a cada 30 min em incidente ativo.
- Encerramento: resumo RCA inicial + acoes pendentes com owner e prazo.

## 8. Evidence Requirements
- `docs/qa/SP23/ops/rollback_dry_run.log`
- `docs/qa/SP23/SP23_REPORT.md`
- Logs QA obrigatorios (build/typecheck/lint changed files)
