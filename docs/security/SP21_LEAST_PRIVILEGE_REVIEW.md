# SP21 - Least Privilege Review

## Principle
Aplicar privilegio minimo por funcao: usuarios de aplicacao apenas no escopo do tenant; automacoes de CI com credenciais read-only sempre que possivel; chaves privilegiadas fora do repo.

## Access Surface Review
| Surface | Expected Privilege | Validation Method | Status |
|---|---|---|---|
| Frontend user session | Tenant-scoped via RLS | RLS/Tenant gates + policy checks | PASS |
| CI DB checks | Read-only introspection | Gate scripts (`scripts/ci/*.ps1`) | PASS |
| Migration execution | Controlled by GP workflow | Naming gate + linked migration checks | PASS |
| Secrets material | Nunca versionado | SP22 secret scan and ownership review | Pending SP22 |

## Operational Rules
- Nao registrar `DATABASE_URL`, `PGPASSWORD` ou tokens em logs.
- Nao usar service-role para validacoes que aceitam acesso read-only.
- Toda excecao de privilegio deve ter owner e prazo de remediacao.

## SP21 Conclusion
Modelo de least privilege operacional permanece aderente para fechamento de RLS na fase atual.
