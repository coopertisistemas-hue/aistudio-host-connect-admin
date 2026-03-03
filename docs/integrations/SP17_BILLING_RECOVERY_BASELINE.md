# SP17 Billing Recovery Baseline

## Objective
Entregar baseline de recovery de cobranca com idempotencia e classificacao operacional de eventos.

## Delivered
- Novo modulo de idempotencia:
  - `src/lib/monetization/billingIdempotency.ts`
  - geracao de idempotency key deterministica
  - classificacao de recovery (`none|recoverable|terminal`)
- Evolucao do hook de billing:
  - `src/hooks/useBillingOrchestration.tsx`
  - dedupe por chave idempotente
  - metricas de idempotencia (`uniqueKeys`, `duplicateEvents`, `dedupeRate`)
  - metricas de recovery (`recoverableEvents`, `terminalEvents`, `retryQueue`)
- Evolucao da pagina de billing:
  - `src/pages/BillingOrchestrationPage.tsx`
  - cards para sinais de idempotencia e recovery
  - tabela de eventos com `recoveryClass` e `isDuplicate`
  - export CSV v2 com campos de idempotencia

## No-DB Change Statement
- SP17 nao introduz migrations.
- Sem alteracao de schema/policy.

## Operational Outcome
- Menor risco de reprocessamento cego de eventos.
- Priorizacao objetiva da fila de recovery.
- Evidencia auditavel por key e classificacao no mesmo painel.

