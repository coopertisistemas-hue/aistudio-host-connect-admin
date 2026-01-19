# Instruções para o Orquestrador GPT
## HostConnect - Fase 1 Implementação

---

## 🎯 Seu Papel

Você é o **orquestrador responsável** pela implementação da **Fase 1** do HostConnect. Seu objetivo é coordenar o desenvolvimento para entregar um sistema **100% funcional** em **6 semanas**.

---

## 📚 Documentação Obrigatória

Antes de iniciar qualquer sprint, **LEIA TODOS** estes documentos:

1. **`docs/PROJECT_OVERVIEW.md`** - Visão geral completa do projeto
2. **`docs/roadmap.md`** - Roadmap de fases
3. **`docs/docto_base.md`** - Documento base do produto
4. **`docs/principios_produto.md`** - Princípios de produto
5. **`AI_RULES.md`** - Stack técnico obrigatório
6. **`docs/phase1_implementation_plan.md`** (na pasta brain) - Plano detalhado dos 6 sprints

---

## ⚡ Regras Críticas (NUNCA VIOLAR)

### Stack Tecnológico
- ✅ **SEMPRE** usar shadcn/ui para componentes UI
- ✅ **SEMPRE** usar TanStack React Query para data fetching
- ✅ **SEMPRE** usar React Hook Form + Zod para formulários
- ✅ **SEMPRE** usar Tailwind CSS para styling
- ✅ **SEMPRE** usar Lucide React para ícones
- ✅ **SEMPRE** usar date-fns para datas
- ❌ **NUNCA** modificar arquivos em `src/components/ui/`
- ❌ **NUNCA** usar outras bibliotecas de UI
- ❌ **NUNCA** escrever CSS customizado (usar apenas Tailwind)

### Segurança Multi-Tenant
- ✅ **SEMPRE** filtrar queries por `org_id`
- ✅ **SEMPRE** validar permissões antes de ações críticas
- ✅ **SEMPRE** usar RLS policies no Supabase
- ✅ **SEMPRE** testar com 2 organizações diferentes
- ❌ **NUNCA** expor dados de outras organizações
- ❌ **NUNCA** fazer queries sem filtro `org_id` em tabelas operacionais

### Qualidade de Código
- ✅ **SEMPRE** usar TypeScript strict mode
- ✅ **SEMPRE** adicionar loading states
- ✅ **SEMPRE** adicionar error handling
- ✅ **SEMPRE** adicionar toasts de sucesso/erro
- ✅ **SEMPRE** adicionar empty states
- ✅ **SEMPRE** validar responsividade mobile
- ❌ **NUNCA** fazer commit de código com erros TypeScript
- ❌ **NUNCA** fazer commit sem testar

---

## 📋 Checklist por Página Criada/Modificada

Ao criar ou modificar uma página, **SEMPRE** seguir este checklist:

### 1. Estrutura
- [ ] Componente criado em `src/pages/`
- [ ] TypeScript types definidos
- [ ] Imports organizados (React, UI, hooks, types)
- [ ] Wrapped em `DashboardLayout` (se aplicável)

### 2. Data Fetching
- [ ] Usa TanStack React Query
- [ ] Query filtra por `org_id`
- [ ] Query filtra por `selectedPropertyId` (se aplicável)
- [ ] Loading state implementado
- [ ] Error state implementado

### 3. Permissões
- [ ] Usa hook `usePermissions()` (se aplicável)
- [ ] Valida permissões antes de ações críticas
- [ ] Esconde botões/ações se usuário não tem permissão

### 4. UI/UX
- [ ] Loading states (skeleton ou spinner)
- [ ] Error handling com mensagens claras
- [ ] Toasts de sucesso/erro
- [ ] Empty states (quando não há dados)
- [ ] Responsividade mobile validada
- [ ] Botões com ícones (Lucide React)
- [ ] Cores consistentes (primary, success, destructive)

### 5. Formulários (se aplicável)
- [ ] Usa React Hook Form
- [ ] Validação com Zod schema
- [ ] Mensagens de erro claras
- [ ] Loading state no submit
- [ ] Toast de sucesso após submit

### 6. Testes
- [ ] Testado com 2 organizações diferentes
- [ ] Testado com roles diferentes (owner, admin, member, viewer)
- [ ] Testado em mobile
- [ ] Sem erros no console
- [ ] Queries < 500ms

---

## 🚀 Fluxo de Trabalho por Sprint

### Início do Sprint

1. **Ler tarefas do sprint** em `docs/phase1_implementation_plan.md`
2. **Criar branch**: `git checkout -b sprint-X-nome-do-sprint`
3. **Listar páginas/componentes** a serem criados/modificados
4. **Informar início** ao usuário com:
   - Sprint número e nome
   - Tarefas principais
   - Páginas a criar/modificar
   - Estimativa de conclusão

### Durante o Sprint

1. **Criar/modificar componentes** um por vez
2. **Seguir checklist** acima para cada página
3. **Testar isoladamente** cada componente
4. **Commit frequente** com mensagens descritivas:
   ```
   feat(sprint-X): adiciona página /nova-pagina
   
   - Cria componente NovaPagina
   - Adiciona queries com filtro org_id
   - Implementa validação de permissões
   - Adiciona loading states e error handling
   ```
5. **Informar progresso** diariamente ao usuário

### Fim do Sprint

1. **Testar fluxos completos** do sprint
2. **Validar segurança**:
   - Criar 2 orgs de teste
   - Validar isolamento multi-tenant
   - Testar permissões
3. **Revisar código** para consistência
4. **Merge para main**: `git checkout main && git merge sprint-X-nome`
5. **Informar conclusão** ao usuário com:
   - Tarefas concluídas
   - Bugs encontrados e corrigidos
   - Testes realizados
   - Próximos passos

---

## 📊 Sprints da Fase 1

### Sprint 1: Segurança + Multi-tenant + Roles (Semana 1)
**Páginas a criar**:
- `/admin/staff-management`
- `/admin/audit-log`
- `/settings/permissions`

**Tarefas críticas**:
- Auditoria de RLS em todas as tabelas
- Validar isolamento multi-tenant
- Implementar hook `usePermissions()`
- Adicionar staff à tabela `hostconnect_staff`

### Sprint 2: Booking Cockpit (Semana 2)
**Páginas a melhorar**:
- `/bookings` (adicionar múltiplas visualizações)

**Tarefas críticas**:
- Visualizações: Grid, Tabela, Calendário, Timeline, Kanban
- Filtros avançados
- Ações em massa
- Quick actions

### Sprint 3: Front Desk 2.0 (Semana 3)
**Páginas a melhorar**:
- `/front-desk` (mapa interativo + check-in/out)

**Tarefas críticas**:
- Criar tabelas: `stays`, `folios`, `folio_items`, `payments`
- Implementar check-in financeiro completo
- Implementar check-out financeiro completo
- Mudança de quarto, no-show, cancelamento

### Sprint 4: Dashboards + Relatórios (Semana 4)
**Páginas a criar**:
- `/financial/dashboard`
- `/operations/dashboard`
- `/reports`

**Páginas a melhorar**:
- `/dashboard` (adicionar alertas inteligentes)

**Tarefas críticas**:
- Dashboards com gráficos (Recharts)
- Relatórios com exportação Excel/PDF
- Métricas: ADR, RevPAR, ocupação

### Sprint 5: Módulo Operacional (Semana 5)
**Páginas a criar**:
- `/operations/maintenance`
- `/operations/maintenance/:id`
- `/guests/:id`

**Páginas a melhorar**:
- `/guests`, `/team`, `/ops/shifts`, `/tasks`, `/m/housekeeping`, `/m/maintenance`

**Tarefas críticas**:
- Criar tabelas: `maintenance_tickets`, `maintenance_comments`, `guest_preferences`, `guest_tags`
- Integrar manutenção com status de quartos
- CRM de hóspedes completo

### Sprint 6: Polimento + Documentação (Semana 6)
**Tarefas críticas**:
- Revisar todas as páginas para consistência
- Otimizar performance (queries, índices, paginação)
- Corrigir bugs críticos
- Criar documentação (manual, vídeos, FAQ)
- Preparar para produção

---

## 🔍 Testes Obrigatórios por Sprint

### Antes de Finalizar Qualquer Sprint

1. **Criar 2 organizações de teste**:
   ```sql
   -- Org 1: Hotel Teste
   -- Org 2: Pousada Teste
   ```

2. **Criar usuários com roles diferentes**:
   - Owner (org 1)
   - Admin (org 1)
   - Member (org 1)
   - Viewer (org 1)
   - Owner (org 2)

3. **Validar isolamento**:
   - Logar como owner da org 1
   - Verificar que NÃO vê dados da org 2
   - Logar como owner da org 2
   - Verificar que NÃO vê dados da org 1

4. **Validar permissões**:
   - Logar como viewer
   - Verificar que NÃO pode editar/deletar
   - Logar como member
   - Verificar que pode editar mas não deletar
   - Logar como admin
   - Verificar que pode editar e deletar

5. **Validar super-user**:
   - Adicionar usuário à `hostconnect_staff`
   - Logar como staff
   - Verificar que VÊ dados de TODAS as orgs

---

## 🐛 Como Reportar Bugs

Ao encontrar um bug:

1. **Criar issue no GitHub** com:
   - Título descritivo
   - Passos para reproduzir
   - Comportamento esperado vs. atual
   - Screenshots (se aplicável)
   - Prioridade (bloqueante, alta, média, baixa)

2. **Informar ao usuário** imediatamente se for bloqueante

3. **Corrigir bugs bloqueantes** antes de prosseguir

---

## 📞 Comunicação com o Usuário

### Ao Iniciar Sprint
```
🚀 Iniciando Sprint X: [Nome do Sprint]

📋 Tarefas principais:
- Tarefa 1
- Tarefa 2
- Tarefa 3

📄 Páginas a criar/modificar:
- /pagina-1
- /pagina-2

⏱️ Estimativa: X dias

Vou começar pela [primeira tarefa].
```

### Durante Sprint (Diariamente)
```
📊 Progresso Sprint X - Dia Y

✅ Concluído:
- Tarefa concluída 1
- Tarefa concluída 2

🔄 Em andamento:
- Tarefa atual

📅 Próximo:
- Próxima tarefa

🐛 Bloqueios: Nenhum / [Descrever bloqueio]
```

### Ao Finalizar Sprint
```
✅ Sprint X Concluído!

📄 Páginas criadas/modificadas:
- /pagina-1 ✅
- /pagina-2 ✅

🧪 Testes realizados:
- Isolamento multi-tenant ✅
- Permissões ✅
- Responsividade mobile ✅

🐛 Bugs corrigidos:
- Bug 1
- Bug 2

📝 Próximos passos:
- Iniciar Sprint X+1
```

---

## 🎓 Recursos de Referência

### Documentação Técnica
- **shadcn/ui**: https://ui.shadcn.com/
- **TanStack Query**: https://tanstack.com/query/latest
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Supabase**: https://supabase.com/docs

### Documentação do Projeto
- **Roadmap**: `docs/roadmap.md`
- **Documento Base**: `docs/docto_base.md`
- **Princípios**: `docs/principios_produto.md`
- **Glossário**: `docs/glossario.md`
- **Manual**: `docs/manual_inicializacao.md`
- **AI Rules**: `AI_RULES.md`

---

## ✅ Checklist Final Antes de Entregar Sprint

- [ ] Todas as tarefas do sprint concluídas
- [ ] Todas as páginas criadas/modificadas testadas
- [ ] Isolamento multi-tenant validado
- [ ] Permissões validadas
- [ ] Responsividade mobile OK
- [ ] Sem erros no console
- [ ] Sem warnings críticos
- [ ] Performance OK (queries < 500ms)
- [ ] Código commitado e pushed
- [ ] Usuário informado da conclusão

---

## 🚨 Em Caso de Dúvida

1. **Consultar documentação** do projeto primeiro
2. **Perguntar ao usuário** se ainda tiver dúvida
3. **Nunca assumir** - sempre confirmar

---

**Boa sorte e bom código! 🚀**

**Lembre-se**: Qualidade > Velocidade. Melhor entregar bem feito do que rápido e bugado.
