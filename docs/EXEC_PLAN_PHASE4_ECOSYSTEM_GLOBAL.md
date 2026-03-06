# EXEC PLAN - Phase 4: Ecossistema & Integracao Global

## Scope
Escalar o Host Connect para ecossistema de integracoes externas e monetizacao de parceiros, mantendo isolamento multi-tenant, contratos versionados e trilha auditavel.

## Alignment
- Alinhado ao `docs/roadmap.md` (Fase 4 - Ecossistema & Integracao Global).
- Governanca CONNECT: RLS-first, migrations-only para banco, evidencias deterministicas por sprint.

## Phase Goals
1. Estruturar base contratual e operacional para Channel Manager nativo.
2. Definir base segura para API publica (escopos, limites, versionamento).
3. Preparar foundation de marketplace de experiencias com tenant safety.
4. Entregar visao executiva consolidada para operacao multi-propriedade/rede.

## Non-Negotiables
- Tenant context obrigatorio (`org_id` e `property_id` quando aplicavel).
- Sem hotfix manual em banco; apenas migrations forward-only e idempotentes.
- Sem regressao dos gates: RLS, structural drift, tenant contract.
- Sync-to-git somente com sprint PASS + evidencias em `docs/qa/SPX/`.

---

## SP10 - Channel Manager Foundation

### Goal
Estabelecer base de contratos, observabilidade e controles de sincronizacao para integracoes OTA (Booking/Expedia/Airbnb) com comportamento idempotente e retry-safe.

### In Scope
- Contratos baseline de sync de disponibilidade/preco/restricoes.
- Matriz de erros e retries operacionais.
- Evidencias e checklist de seguranca de tenant para eventos de sync.

### Deliverables
- Documento contratual SP10.
- Checklist tecnico-operacional SP10.
- Pacote de QA SP10 em `docs/qa/SP10/`.

### QA Required
- `pnpm build`
- `pnpm exec tsc --noEmit`
- `eslint` somente para arquivos alterados
- Se banco for alterado: `db push` + gates SQL

---

## SP11 - Public API Hardening

### Goal
Definir e endurecer a borda de API publica com versionamento, autenticao, rate limits e garantias de isolamento tenant.

### In Scope
- Contratos e versionamento de endpoints publicos.
- Escopos de token/chave e limites de uso.
- Auditoria minima de requests e falhas.

### Deliverables
- Spec de API publica v1 (base).
- Regras de autenticacao/autorizacao.
- Evidencias SP11.

---

## SP12 - Marketplace + Executive Consolidation

### Goal
Fechar a fase com base operacional para marketplace de experiencias e visao executiva consolidada por organizacao.

### In Scope
- Estrutura de dados/processo para parceiros e experiencias.
- Reconciliacao operacional-financeira de experiencias.
- Dashboards executivos multi-propriedade.

### Deliverables
- Foundation marketplace (contracts + controls).
- Consolidated executive reporting baseline.
- Evidencias SP12 e fechamento da fase.

---

## Phase 4 Exit Criteria
- SP10, SP11 e SP12 com PASS e evidencias completas.
- Contratos externos versionados e auditaveis.
- Nenhuma regressao de isolamento tenant e gates CI.
- `docs/milestones/PHASE_4_REPORT.md` publicado.
