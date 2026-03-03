# EXEC PLAN - Phase 6: SaaS Billing & Subscription Engine

## Scope
Consolidar o motor SaaS de assinatura/cobranca do Host Connect com lifecycle de subscription, proration, dunning resiliente, conciliacao e governanca tenant-first.

## Alignment
- Sequencia apos conclusao da Fase 5 (SP13-SP15).
- Governanca CONNECT: RLS-first, migrations-only no banco, evidencias deterministicas por sprint.
- Foco em integridade financeira e previsibilidade operacional.

## Phase Goals
1. Endurecer lifecycle de assinatura (trial, active, grace, suspended, cancelled) com regras auditiveis.
2. Garantir cobranca resiliente com idempotency, retry controlado e trilha de eventos.
3. Consolidar reconciliacao subscription/invoice/payment para reduzir leakage de receita.
4. Entregar operacao segura para upgrades/downgrades sem vazamento tenant.

## Non-Negotiables
- Tenant context obrigatorio em toda operacao (`org_id` e `property_id` quando aplicavel).
- Sem hotfix manual em banco; apenas migrations forward-only e idempotentes.
- Nenhuma regressao dos gates: RLS, structural drift, tenant contract.
- Sync-to-git somente com sprint PASS + evidencias em `docs/qa/SPX/`.

---

## SP16 - Subscription Lifecycle Hardening

### Goal
Padronizar e endurecer ciclo de vida de assinatura com contratos claros de estado/transicao.

### In Scope
- Contrato de estados de subscription (entry/exit criteria).
- Guardrails para transicoes invalidas (ex.: cancelled -> active sem evento valido).
- Baseline operacional para trial/grace/suspension.

### Deliverables
- Subscription lifecycle contract v1.
- Baseline de validacao/transicao no app.
- Evidencias SP16.

### QA Required
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `eslint` somente para arquivos alterados
- Se banco for alterado: `db push` + gates SQL

---

## SP17 - Billing Idempotency & Recovery

### Goal
Blindar fluxo de cobranca contra duplicidade, perda de evento e race conditions.

### In Scope
- Contrato de idempotency para eventos de cobranca.
- Retry orchestration com classificacao de falha recuperavel x terminal.
- Sinais operacionais para recovery de receita.

### Deliverables
- Billing idempotency contract v1.
- Baseline de recovery/retry para operacao.
- Evidencias SP17.

---

## SP18 - Subscription Settlement & Revenue Assurance

### Goal
Consolidar reconciliacao final entre assinatura, faturamento e pagamento para fechamento confiavel.

### In Scope
- Regras de conciliacao subscription x invoice x payment.
- Indicadores de leakage/blockers de monetizacao.
- Baseline de fechamento operacional (go/no-go de faturamento).

### Deliverables
- Revenue assurance baseline.
- Contrato de reconciliacao final da fase.
- Evidencias SP18 e fechamento da fase.

---

## Phase 6 Exit Criteria
- SP16, SP17 e SP18 com PASS e evidencias completas.
- Contratos de lifecycle/idempotency/reconciliacao versionados.
- Nenhuma regressao de isolamento tenant e gates CI.
- `docs/milestones/PHASE_6_REPORT.md` publicado.

