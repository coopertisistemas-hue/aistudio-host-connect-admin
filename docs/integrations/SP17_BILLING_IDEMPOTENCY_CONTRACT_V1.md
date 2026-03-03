# SP17 Billing Idempotency Contract (v1.0)

## Purpose
Blindar fluxo de cobranca contra duplicidade de processamento e melhorar trilha de recovery.

## Idempotency Key
- Chave deterministica por evento de cobranca:
  - `billing:{invoice_id}:{status}:{retry_stage}:{due_date|no_due}:{amount}`
- Objetivo:
  - detectar eventos duplicados no mesmo escopo de organizacao/propriedade
  - manter dedupe auditavel no painel e export CSV

## Event Classification
1. `recoveryClass = none`
- status `paid` ou `cancelled`
- ou status sem atraso (retry `none`)

2. `recoveryClass = recoverable`
- status `pending|partially_paid` com retry `d0|d3|d7`

3. `recoveryClass = terminal`
- status `pending|partially_paid` com retry `d14`

## Operational Signals
- `uniqueKeys`: total de chaves idempotentes distintas
- `duplicateEvents`: total de eventos com chave repetida
- `dedupeRate`: taxa de eventos unicos
- `retryQueue`: volume de eventos elegiveis para acao de recovery
- `recoverableEvents` e `terminalEvents`: triagem de acao financeira

## Tenant Guardrails
- Indicadores restritos por `org_id` + `property_id` no contexto selecionado.
- Sem agregacao cross-tenant.

## Export Contract
- CSV deve incluir:
  - `idempotency_key`
  - `is_duplicate`
  - `recovery_class`
  - campos base do evento de cobranca

