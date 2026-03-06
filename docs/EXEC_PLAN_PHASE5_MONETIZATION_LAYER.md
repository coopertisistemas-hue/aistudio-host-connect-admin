# EXEC PLAN - Phase 5: Monetization Layer

## Scope
Consolidar a camada de monetizacao do Host Connect com governanca de planos/entitlements, cobranca recorrente auditavel e inteligencia de receita para expansao de MRR com seguranca tenant-first.

## Alignment
- Alinhado ao roadmap estrategico de lock-in + revenue expansion.
- Governanca CONNECT: RLS-first, migrations-only no banco, evidencias deterministicas por sprint.
- Sequencia apos conclusao da Fase 4 (SP10-SP12).

## Phase Goals
1. Endurecer regras de monetizacao (planos, limites e entitlements) sem bypass por frontend.
2. Estruturar fluxo de billing recorrente com estados de cobranca/dunning auditaveis.
3. Entregar visao de receita (MRR, churn risk, inadimplencia, mix de planos) por organizacao.
4. Reduzir risco operacional de cobranca com trilha de eventos e reconciliacao.

## Non-Negotiables
- Tenant context obrigatorio em todas as operacoes (`org_id` e `property_id` quando aplicavel).
- Sem hotfix manual em banco; apenas migrations forward-only e idempotentes.
- Nenhuma regressao dos gates: RLS, structural drift, tenant contract.
- Sync-to-git somente com sprint PASS + evidencias em `docs/qa/SPX/`.

---

## SP13 - Pricing & Entitlement Integrity

### Goal
Garantir integridade de monetizacao na origem: consistencia de planos, limites e entitlement checks com enforcement server-side.

### In Scope
- Hardening de regras de plano/entitlement em pontos criticos de produto.
- Validacoes de limites monetizaveis (accommodations/features) com mensagens operacionais claras.
- Auditoria de decisoes de entitlement (allow/deny/upgrade_required).

### Deliverables
- Matriz de regras de monetizacao v1.
- Ajustes de enforcement em hooks/fluxos sensiveis.
- Evidencias SP13.

### QA Required
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `eslint` somente para arquivos alterados
- Se banco for alterado: `db push` + gates SQL

---

## SP14 - Billing Orchestration & Dunning

### Goal
Estruturar ciclo de cobranca recorrente com estados claros, tratamento de falhas e recuperacao de receita (dunning) de forma auditavel.

### In Scope
- Contrato de eventos de billing (attempted/paid/failed/cancelled/refunded quando aplicavel).
- Fundacao de dunning (retries, janelas, sinalizacao de risco).
- Reconciliacao operacional-financeira entre faturas/pagamentos/estado do plano.

### Deliverables
- Billing event contract v1.
- Baseline operacional de dunning e reconciliacao.
- Evidencias SP14.

---

## SP15 - Revenue Intelligence & Monetization Console

### Goal
Entregar console executivo de monetizacao com indicadores acionaveis para crescimento e retencao.

### In Scope
- KPIs de monetizacao (MRR baseline, inadimplencia, mix de planos, upgrade opportunities).
- Painel de risco de receita por organizacao/propriedade.
- Export basico para analise operacional (CSV).

### Deliverables
- Monetization console baseline.
- Contrato de indicadores de receita.
- Evidencias SP15 e fechamento da fase.

---

## Phase 5 Exit Criteria
- SP13, SP14 e SP15 com PASS e evidencias completas.
- Regras de monetizacao e billing com contratos versionados e auditaveis.
- Nenhuma regressao de isolamento tenant e gates CI.
- `docs/milestones/PHASE_5_REPORT.md` publicado.

