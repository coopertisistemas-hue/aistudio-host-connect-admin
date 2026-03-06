# EXEC PLAN - Phase 3: Reserve Connect Integration

## Scope
Integrar Host Connect ao Reserve Connect com contratos explícitos, isolamento multi-tenant e trilha auditável ponta a ponta para disponibilidade, reserva, cobrança e sincronização operacional.

## Phase Goals
1. Estabelecer contratos Host <-> Reserve canônicos e versionados.
2. Garantir consistência de dados entre reservas, inventário e pagamentos.
3. Evitar regressão de isolamento de tenant em toda integração.

## Non-Negotiables
- RLS-first e escopo por `org_id` / `property_id`.
- Sem hotfix manual em banco.
- Mudanças de schema apenas por migration forward-only e idempotente.
- Evidência determinística por sprint em `docs/qa/SPX/`.
- Sync-to-git somente com sprint PASS.

---

## SP7 - Integration Contracts and Sync Baseline

### Goal
Definir baseline contratual de integração Reserve <-> Host e validar trilha mínima de sincronização segura.

### In Scope
- Matriz de contratos (payloads, ownership, versioning, auth context).
- Critérios de idempotência para eventos de reserva e atualização.
- Regras de reconciliação inicial de status/valores entre sistemas.

### Deliverables
- Documento de contratos de integração v1.
- Checklist de validação técnica e de segurança.
- Pacote de evidências SP7 (`docs/qa/SP7/`).

### QA Required
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `eslint` para arquivos alterados
- Se tocar banco: `db push` + gates SQL

---

## SP8 - Reservation Orchestration Flow

### Goal
Implementar o fluxo de orquestração de reservas entre Host e Reserve com retry-safe behavior.

### In Scope
- Criação/atualização/cancelamento sincronizados.
- Regras de deduplicação e idempotência por chave de evento.
- Tratamento de conflito com estado fonte.

### Deliverables
- Fluxos de sincronização com logs de auditoria.
- Evidências SP8.

---

## SP9 - Settlement and Operational Feedback Loop

### Goal
Fechar o ciclo financeiro-operacional da integração para settlement e qualidade de operação.

### In Scope
- Conciliação de settlement entre fontes.
- Feedback operacional (falhas de sync, retries, pendências).
- Export/report de reconciliação da integração.

### Deliverables
- Painel/relatório de reconciliação da integração.
- Evidências SP9.

---

## Phase 3 Exit Criteria
- SP7, SP8 e SP9 com PASS e evidências completas.
- Contratos de integração aprovados e versionados.
- Sem regressão de RLS/tenant isolation.
- `docs/milestones/PHASE_3_REPORT.md` publicado.
