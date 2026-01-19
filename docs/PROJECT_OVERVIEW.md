# HostConnect - Documentação Completa do Projeto
## Sistema de Gestão Hoteleira Multi-Tenant

**Versão**: 2.0  
**Data**: Janeiro 2026  
**Status**: Fase 1 - Implementação Completa em Andamento

---

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura Técnica](#arquitetura-técnica)
3. [Estado Atual do Projeto](#estado-atual-do-projeto)
4. [Plano de Execução - Fase 1](#plano-de-execução---fase-1)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Segurança e Multi-Tenant](#segurança-e-multi-tenant)
7. [Guia para o Orquestrador GPT](#guia-para-o-orquestrador-gpt)

---

## 1. Visão Geral do Projeto

### 1.1 O Que é o HostConnect?

**HostConnect** é uma plataforma SaaS completa de gestão hoteleira, projetada para atender desde pousadas alternativas até hotéis com até 100 apartamentos. É o "Studio Operacional" onde proprietários e equipe gerenciam cada detalhe da jornada do hóspede.

### 1.2 Público-Alvo

- **Hospitalidade Comercial**: Pousadas, hotéis boutique, hostels, chalés
- **Locação por Temporada**: Casas, cabanas, vilas
- **Segmento de Eventos e Retiros**: Centros de convenções, retiros cristãos

### 1.3 Diferenciais

- ✅ **Multi-tenant robusto**: Múltiplas organizações e propriedades
- ✅ **Mobile-first**: Operação "em pé" (recepção, governança, manutenção)
- ✅ **Branding dinâmico**: Interface adaptável à identidade de cada propriedade
- ✅ **Preparado para IA**: Estrutura de dados pronta para automações futuras

### 1.4 Situação Atual

- **1 hotel em implementação** (esta semana)
- **Pousadas iniciam esta semana**
- **54 páginas implementadas** com funcionalidades core
- **Fase 1 em andamento**: Completar sistema para 100% funcional

---

## 2. Arquitetura Técnica

### 2.1 Stack Tecnológico

```yaml
Frontend:
  Framework: React 18 + TypeScript
  Build Tool: Vite
  Styling: Tailwind CSS
  UI Components: shadcn/ui (Radix UI)
  Routing: React Router DOM v6
  State Management: TanStack React Query
  Forms: React Hook Form + Zod
  Icons: Lucide React
  Date Handling: date-fns

Backend/Database:
  Platform: Supabase
  Database: PostgreSQL
  Authentication: Supabase Auth
  Storage: Supabase Storage
  Realtime: Supabase Realtime

Deployment:
  Hosting: Vercel
  Package Manager: pnpm
```

### 2.2 Estrutura de Pastas

```
aistudio-host-connect-admin/
├── docs/                          # Documentação do projeto
│   ├── roadmap.md                 # Roadmap de fases
│   ├── docto_base.md              # Documento base do produto
│   ├── principios_produto.md      # Princípios de produto
│   ├── glossario.md               # Glossário de termos
│   ├── manual_inicializacao.md    # Manual de setup inicial
│   └── decision_log.md            # Log de decisões técnicas
├── src/
│   ├── components/                # Componentes React
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── landing/               # Componentes da Landing Page
│   │   └── ...                    # Outros componentes
│   ├── pages/                     # Páginas da aplicação (54+)
│   │   ├── Dashboard.tsx
│   │   ├── Bookings.tsx
│   │   ├── FrontDeskPage.tsx
│   │   ├── mobile/                # Páginas mobile (16)
│   │   └── support/               # Módulo de suporte
│   ├── hooks/                     # Custom React hooks
│   ├── lib/                       # Utilitários
│   ├── integrations/supabase/     # Cliente Supabase
│   └── types/                     # TypeScript types
├── supabase/
│   ├── migrations/                # Migrações SQL (35 arquivos)
│   └── functions/                 # Edge Functions
└── public/                        # Assets estáticos
```

### 2.3 Páginas Implementadas (54)

#### Gestão de Propriedades
- `/properties` - Lista de propriedades
- `/room-types` - Tipos de quarto
- `/room-categories` - Categorias de quarto
- `/rooms` - Quartos individuais
- `/amenities` - Comodidades

#### Reservas e Operação
- `/bookings` - Gestão de reservas
- `/front-desk` - Front Desk (mapa de quartos)
- `/arrivals` - Chegadas do dia
- `/departures` - Saídas do dia
- `/operation/rooms` - Quadro de quartos
- `/operation/housekeeping` - Governança
- `/operation/demands` - Demandas/solicitações
- `/operation/folio/:id` - Extrato financeiro

#### Financeiro
- `/financial` - Dashboard financeiro
- `/pricing-rules` - Regras de preço
- `/services` - Serviços extras
- `/expenses` - Despesas
- `/pdv` - Ponto de Venda (PDV)

#### Inventário
- `/inventory` - Catálogo de itens
- `/ops/pantry-stock` - Estoque de copa

#### Gestão de Equipe
- `/team` - Gestão de equipe
- `/ops/shifts` - Escalas de trabalho
- `/me/shifts` - Minhas escalas
- `/ops/staff` - Gerenciamento de staff
- `/tasks` - Tarefas

#### Hóspedes
- `/guests` - Lista de hóspedes

#### Marketing
- `/marketing/overview` - Visão geral
- `/marketing/connectors` - Conectores
- `/marketing/google` - Google Marketing
- `/marketing/ota/:provider` - OTAs
- `/marketing/inbox` - Inbox social

#### Configurações
- `/settings` - Configurações gerais
- `/website-settings` - Configurações do site
- `/plans` - Planos de assinatura

#### Admin
- `/admin-panel` - Painel administrativo
- `/admin/pricing-plans` - Gestão de planos
- `/admin/features` - Gestão de features
- `/admin/faqs` - Gestão de FAQs
- `/admin/testimonials` - Gestão de depoimentos
- `/admin/how-it-works` - Gestão de "Como Funciona"
- `/admin/integrations` - Gestão de integrações

#### Suporte
- `/support` - Hub de suporte
- `/support/tickets` - Tickets de suporte
- `/support/ideas` - Ideias/sugestões
- `/support/admin/tickets` - Admin de tickets
- `/support/admin/ideas` - Admin de ideias

#### Mobile (16 páginas)
- `/m` - Home mobile
- `/m/profile` - Perfil
- `/m/housekeeping` - Governança mobile
- `/m/maintenance` - Manutenção mobile
- `/m/ops-now` - Operações agora
- `/m/rooms` - Mapa de quartos mobile
- `/m/notifications` - Notificações
- `/m/laundry` - Lavanderia
- `/m/pantry` - Copa
- `/m/financial` - Financeiro mobile
- `/m/reservations` - Reservas mobile
- `/m/executive` - Dashboard executivo
- E outras...

#### Outras
- `/` - Landing Page
- `/auth` - Autenticação
- `/onboarding` - Onboarding
- `/dashboard` - Dashboard principal
- `/book/:propertyId` - Motor de reservas público
- `/booking-success` - Sucesso de reserva
- `/booking-cancel` - Cancelamento de reserva

---

## 3. Estado Atual do Projeto

### 3.1 O Que Está Implementado ✅

#### Infraestrutura
- ✅ Multi-tenant completo (Organizações → Propriedades → Acomodações)
- ✅ Autenticação e RLS (Row Level Security)
- ✅ Sistema de Planos e Entitlements
- ✅ Onboarding funcional
- ✅ Team Management (convites, roles)
- ✅ Audit Log

#### Módulos Operacionais
- ✅ Gestão de Acomodações (tipos, categorias, comodidades, fotos)
- ✅ Inventário Completo (catálogo, estoque, PDV, pricing)
- ✅ Serviços Extras
- ✅ Pricing Rules (regras de preço e sazonalidade)
- ✅ Reservas (estrutura básica, booking charges, serviços)
- ✅ Front Desk Parcial (mapa de quartos, status)
- ✅ Governança e Manutenção (páginas mobile)
- ✅ Gestão de Hóspedes (básico)

#### Landing Page e Marketing
- ✅ Landing Page completa (12 seções)
- ✅ SEO otimizado
- ✅ Admin de conteúdo

#### Segurança
- ✅ RLS em todas as tabelas
- ✅ Multi-tenant com `org_id` enforcement
- ✅ Super-user access (`is_hostconnect_staff()`)
- ✅ Roles (owner, admin, member, viewer)

### 3.2 O Que Falta (Gaps Críticos) ❌

#### Front Desk 2.0
- ❌ Check-in financeiro completo
- ❌ Check-out com fechamento de conta (Folio)
- ❌ Mudança de quarto
- ❌ No-show e cancelamento com políticas

#### Booking Cockpit
- ❌ Visualizações múltiplas (grid, tabela, calendário, timeline, kanban)
- ❌ Filtros avançados
- ❌ Ações em massa
- ❌ Quick actions

#### Dashboards e Relatórios
- ❌ Dashboard financeiro dedicado
- ❌ Dashboard operacional dedicado
- ❌ Página de relatórios (ocupação, receita, hóspedes, PDV)
- ❌ Exportação para Excel/PDF

#### Módulo Operacional
- ❌ Governança mobile com priorização
- ❌ Manutenção integrada ao status do quarto
- ❌ CRM de hóspedes completo (histórico, preferências, tags)

#### Páginas Faltantes
- ❌ `/admin/staff-management` - Gerenciar super-usuários
- ❌ `/admin/audit-log` - Visualizar audit log
- ❌ `/settings/permissions` - Gerenciar permissões granulares
- ❌ `/financial/dashboard` - Dashboard financeiro
- ❌ `/reports` - Página de relatórios
- ❌ `/operations/dashboard` - Dashboard operacional
- ❌ `/operations/maintenance` - Gestão de manutenção (desktop)
- ❌ `/guests/:id` - Detalhes do hóspede

---

## 4. Plano de Execução - Fase 1

### 4.1 Objetivo

**Entregar sistema 100% funcional** em **6 semanas** (19/01 a 02/03/2026) incluindo:
- Todos os módulos existentes funcionais
- Páginas faltantes criadas
- Roles e perfis completos
- Multi-tenant em todas as páginas
- Dashboards inteligentes
- Relatórios operacionais
- Booking Cockpit profissional

### 4.2 Sprints

#### Sprint 1: Segurança + Multi-tenant + Roles (Semana 1)
**Objetivo**: Garantir isolamento total de dados e roles funcionando.

**Tarefas**:
- Auditoria de RLS em todas as tabelas
- Validar isolamento multi-tenant (testar com 2 orgs)
- Implementar super-user access completo
- Criar hook `usePermissions()` para checks de permissão
- Criar páginas:
  - `/admin/staff-management`
  - `/admin/audit-log`
  - `/settings/permissions`

**Entregável**: Sistema seguro com multi-tenant validado.

---

#### Sprint 2: Booking Cockpit (Semana 2)
**Objetivo**: Criar central de comando profissional para reservas.

**Tarefas**:
- Melhorar `/bookings` com múltiplas visualizações:
  - Grid (cards)
  - Tabela (data table com sorting)
  - Calendário
  - Timeline
  - Kanban (por status)
- Implementar filtros avançados
- Implementar ações em massa (exportar, email, mudar status)
- Implementar quick actions (check-in/out rápido, enviar voucher)
- Adicionar estatísticas no topo

**Entregável**: Booking Cockpit profissional.

---

#### Sprint 3: Front Desk 2.0 Completo (Semana 3)
**Objetivo**: Completar Front Desk com check-in/out financeiro.

**Tarefas**:
- Melhorar mapa de quartos (`/front-desk`):
  - Visualização por andar/bloco
  - Cores por status
  - Hover com informações
  - Click para ações rápidas
- Implementar check-in financeiro completo:
  - Modal com dados do hóspede
  - Seleção de quarto
  - Captura de pagamento/depósito
  - Criar tabelas: `stays`, `folios`, `folio_items`, `payments`
- Implementar check-out financeiro completo:
  - Exibir Folio completo
  - Captura de pagamento final
  - Atualizar status do quarto
- Implementar mudança de quarto
- Implementar no-show e cancelamento

**Entregável**: Front Desk 2.0 completo.

---

#### Sprint 4: Dashboards Inteligentes + Relatórios (Semana 4)
**Objetivo**: Criar dashboards com insights e relatórios.

**Tarefas**:
- Melhorar `/dashboard` com alertas inteligentes
- Criar `/financial/dashboard`:
  - Receita por período
  - Despesas por período
  - Lucro líquido
  - Contas a receber/pagar
- Criar `/operations/dashboard`:
  - Status de quartos em tempo real
  - Governança (quartos limpos, pendentes)
  - Manutenção (tickets abertos, resolvidos)
  - Tarefas (pendentes, concluídas, atrasadas)
- Criar `/reports`:
  - Relatório de ocupação
  - Relatório de receita (ADR, RevPAR)
  - Relatório de hóspedes
  - Relatório de consumo (PDV)
  - Exportação para Excel/PDF

**Entregável**: Dashboards e relatórios completos.

---

#### Sprint 5: Módulo Operacional Completo (Semana 5)
**Objetivo**: Completar módulos operacionais.

**Tarefas**:
- Melhorar governança mobile com priorização
- Criar `/operations/maintenance` (desktop):
  - Lista de tickets
  - Criar novo ticket
  - Criar tabelas: `maintenance_tickets`, `maintenance_comments`
- Criar `/operations/maintenance/:id` (detalhes do ticket)
- Integrar manutenção com status de quartos
- Melhorar `/guests` e criar `/guests/:id`:
  - Histórico de estadias
  - Preferências
  - Tags (VIP, Recorrente)
  - Criar tabelas: `guest_preferences`, `guest_tags`
- Melhorar gestão de equipe e escalas

**Entregável**: Módulo operacional 100% funcional.

---

#### Sprint 6: Polimento Final + Documentação (Semana 6)
**Objetivo**: Polir UX/UI e documentar sistema.

**Tarefas**:
- Revisar todas as páginas para consistência visual
- Adicionar loading states, toasts, empty states
- Otimizar performance (queries, índices, paginação)
- Corrigir bugs críticos
- Criar documentação:
  - Manual do usuário
  - Vídeos de treinamento
  - FAQ
  - Documentação técnica
- Preparar para produção (variáveis de ambiente, Sentry, etc.)

**Entregável**: Sistema 100% pronto para produção.

---

### 4.3 Cronograma

| Sprint | Período | Foco | Páginas | Entregável |
|--------|---------|------|---------|------------|
| 1 | 19-25/01 | Segurança | 3 novas | Sistema seguro |
| 2 | 26/01-01/02 | Booking Cockpit | 1 melhorada | Central de Comando |
| 3 | 02-08/02 | Front Desk 2.0 | 1 melhorada | Check-in/out completo |
| 4 | 09-15/02 | Dashboards | 4 novas | Insights e relatórios |
| 5 | 16-22/02 | Operacional | 2 novas, 7 melhoradas | Operação completa |
| 6 | 23/02-02/03 | Polimento | Todas revisadas | Sistema 100% pronto |

**Total: 6 semanas**

---

## 5. Estrutura de Dados

### 5.1 Tabelas Principais (Existentes)

#### Core
- `profiles` - Perfis de usuários
- `organizations` - Organizações (multi-tenant)
- `org_members` - Membros de organizações (roles)
- `hostconnect_staff` - Staff da HostConnect (super-users)
- `properties` - Propriedades
- `rooms` - Quartos individuais
- `room_types` - Tipos de quarto
- `amenities` - Comodidades
- `entity_photos` - Fotos (propriedades, tipos de quarto)

#### Reservas
- `bookings` - Reservas
- `booking_charges` - Despesas extras em reservas
- `booking_services` - Serviços vinculados a reservas

#### Financeiro
- `pricing_rules` - Regras de preço
- `services` - Serviços extras
- `expenses` - Despesas

#### Inventário
- `inventory_items` - Catálogo de itens
- `pantry_stock` - Estoque de copa

#### Operacional
- `tasks` - Tarefas
- `tickets` - Tickets de suporte
- `ideas` - Ideias/sugestões
- `audit_log` - Log de auditoria

#### Permissões
- `member_permissions` - Permissões granulares por módulo
- `org_invites` - Convites para organizações

### 5.2 Tabelas a Serem Criadas (Fase 1)

#### Sprint 3 - Front Desk
```sql
-- Estadias (diferencia reserva de estadia real)
CREATE TABLE public.stays (
  id UUID PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  room_id UUID REFERENCES rooms(id),
  org_id UUID REFERENCES organizations(id),
  actual_check_in TIMESTAMPTZ,
  actual_check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

-- Folios (extratos financeiros)
CREATE TABLE public.folios (
  id UUID PRIMARY KEY,
  stay_id UUID REFERENCES stays(id),
  org_id UUID REFERENCES organizations(id),
  total_charges DECIMAL DEFAULT 0,
  total_payments DECIMAL DEFAULT 0,
  balance DECIMAL DEFAULT 0,
  status TEXT DEFAULT 'open'
);

-- Itens do Folio
CREATE TABLE public.folio_items (
  id UUID PRIMARY KEY,
  folio_id UUID REFERENCES folios(id),
  org_id UUID REFERENCES organizations(id),
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  quantity INTEGER DEFAULT 1,
  item_type TEXT -- daily, service, pdv, tax
);

-- Pagamentos
CREATE TABLE public.payments (
  id UUID PRIMARY KEY,
  folio_id UUID REFERENCES folios(id),
  booking_id UUID REFERENCES bookings(id),
  org_id UUID REFERENCES organizations(id),
  amount DECIMAL NOT NULL,
  method TEXT NOT NULL, -- cash, credit_card, pix
  status TEXT DEFAULT 'pending',
  transaction_id TEXT
);
```

#### Sprint 5 - Manutenção
```sql
-- Tickets de Manutenção
CREATE TABLE public.maintenance_tickets (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  org_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES profiles(id),
  created_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ
);

-- Comentários em Tickets
CREATE TABLE public.maintenance_comments (
  id UUID PRIMARY KEY,
  ticket_id UUID REFERENCES maintenance_tickets(id),
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL
);
```

#### Sprint 5 - CRM
```sql
-- Preferências de Hóspedes
CREATE TABLE public.guest_preferences (
  id UUID PRIMARY KEY,
  guest_id UUID REFERENCES profiles(id),
  org_id UUID REFERENCES organizations(id),
  preference_type TEXT NOT NULL,
  value TEXT NOT NULL
);

-- Tags de Hóspedes
CREATE TABLE public.guest_tags (
  id UUID PRIMARY KEY,
  guest_id UUID REFERENCES profiles(id),
  org_id UUID REFERENCES organizations(id),
  tag TEXT NOT NULL -- VIP, Recorrente, etc.
);
```

---

## 6. Segurança e Multi-Tenant

### 6.1 Arquitetura Multi-Tenant

**Hierarquia**:
```
Organization (org_id)
  └── Properties
      └── Rooms
      └── Room Types
      └── Bookings
      └── Inventory
      └── etc.
```

**Isolamento**:
- Todas as tabelas operacionais têm `org_id`
- RLS (Row Level Security) filtra automaticamente por `org_id`
- Usuário só vê dados da sua organização

### 6.2 Roles e Permissões

#### Roles Principais
- **Owner**: Dono da organização, acesso total
- **Admin**: Administrador, acesso quase total
- **Member**: Membro da equipe, acesso operacional
- **Viewer**: Apenas visualização

#### Super-User (HostConnect Staff)
- Acesso cross-org para suporte
- Função `is_hostconnect_staff()` verifica se usuário está em `hostconnect_staff`
- Políticas RLS permitem staff ver todos os dados

#### Permissões Granulares
- Tabela `member_permissions` define permissões por módulo
- Módulos: financial, guests, tasks, bookings, settings, etc.
- Permissões: can_read, can_write

### 6.3 RLS (Row Level Security)

**Exemplo de Política**:
```sql
-- Bookings: Membros da org podem ver
CREATE POLICY "Members view org bookings" ON bookings
  FOR SELECT USING (
    public.is_org_member(org_id)
  );

-- Bookings: Staff pode ver tudo
CREATE POLICY "Staff views all bookings" ON bookings
  FOR SELECT USING (
    public.is_hostconnect_staff()
  );
```

**Funções Helper**:
- `is_org_member(org_id)` - Verifica se usuário é membro da org
- `is_org_admin(org_id)` - Verifica se usuário é admin da org
- `is_hostconnect_staff()` - Verifica se usuário é staff

---

## 7. Guia para o Orquestrador GPT

### 7.1 Contexto do Projeto

Você é o **orquestrador GPT** responsável por coordenar a implementação da **Fase 1** do HostConnect. Seu objetivo é garantir que o sistema fique **100% funcional** em **6 semanas**.

### 7.2 Prioridades

1. **Segurança em primeiro lugar**: Multi-tenant e RLS devem funcionar perfeitamente
2. **Booking Cockpit e Front Desk**: Módulos mais críticos para operação
3. **Dashboards e Relatórios**: Essenciais para gestão
4. **Qualidade sobre velocidade**: Melhor entregar bem feito do que rápido e bugado

### 7.3 Regras de Desenvolvimento

#### Stack Obrigatório
- **SEMPRE** usar shadcn/ui para componentes
- **SEMPRE** usar TanStack React Query para data fetching
- **SEMPRE** usar React Hook Form + Zod para formulários
- **SEMPRE** usar Tailwind CSS para styling
- **NUNCA** modificar arquivos de `src/components/ui/` diretamente

#### Padrões de Código
- TypeScript strict mode
- Componentes funcionais com hooks
- Nomes de arquivos em PascalCase para componentes
- Nomes de arquivos em camelCase para hooks/utils

#### Segurança
- **SEMPRE** filtrar queries por `org_id`
- **SEMPRE** validar permissões antes de ações críticas
- **SEMPRE** usar RLS policies
- **NUNCA** expor dados de outras organizações

### 7.4 Fluxo de Trabalho por Sprint

#### Início do Sprint
1. Revisar tarefas do sprint no plano
2. Criar branch `sprint-X-nome-do-sprint`
3. Listar todas as páginas/componentes a serem criados/modificados

#### Durante o Sprint
1. Criar/modificar componentes um por vez
2. Testar cada componente isoladamente
3. Validar multi-tenant em cada página
4. Adicionar loading states e error handling
5. Commit frequente com mensagens descritivas

#### Fim do Sprint
1. Testar fluxos completos
2. Validar segurança (RLS, isolamento)
3. Revisar código para consistência
4. Merge para main
5. Deploy para staging
6. Coletar feedback

### 7.5 Checklist por Página Criada/Modificada

- [ ] Componente criado/modificado
- [ ] TypeScript types definidos
- [ ] Queries filtram por `org_id`
- [ ] Permissões validadas (usePermissions)
- [ ] Loading states adicionados
- [ ] Error handling implementado
- [ ] Toasts de sucesso/erro
- [ ] Responsividade mobile validada
- [ ] Empty states adicionados
- [ ] Testado com 2 organizações diferentes

### 7.6 Estrutura de Commits

```
feat(sprint-X): adiciona página /nova-pagina

- Cria componente NovaPagina
- Adiciona queries com filtro org_id
- Implementa validação de permissões
- Adiciona loading states e error handling
```

### 7.7 Testes Obrigatórios

#### Por Sprint
- [ ] Criar 2 organizações de teste
- [ ] Criar usuários com roles diferentes (owner, admin, member, viewer)
- [ ] Validar isolamento multi-tenant
- [ ] Testar permissões granulares
- [ ] Testar fluxos críticos do sprint

#### Antes do Deploy
- [ ] Todos os testes do sprint passando
- [ ] Sem erros no console
- [ ] Sem warnings críticos
- [ ] Performance aceitável (queries < 500ms)
- [ ] Responsividade mobile OK

### 7.8 Comunicação

#### Ao Iniciar Sprint
Informar:
- Sprint número e nome
- Tarefas principais
- Páginas a serem criadas/modificadas
- Estimativa de conclusão

#### Durante Sprint
Informar:
- Progresso diário (% concluído)
- Bloqueios encontrados
- Decisões técnicas tomadas

#### Ao Finalizar Sprint
Informar:
- Tarefas concluídas
- Bugs encontrados e corrigidos
- Testes realizados
- Próximos passos

### 7.9 Documentos de Referência

- **Roadmap**: `docs/roadmap.md`
- **Documento Base**: `docs/docto_base.md`
- **Princípios de Produto**: `docs/principios_produto.md`
- **Glossário**: `docs/glossario.md`
- **Manual de Inicialização**: `docs/manual_inicializacao.md`
- **Plano de Execução**: Este documento
- **AI Rules**: `AI_RULES.md` (stack técnico)

### 7.10 Contatos e Suporte

- **Repositório**: `aistudio-host-connect-admin`
- **Branch Principal**: `main`
- **Branches de Sprint**: `sprint-X-nome`
- **Issues**: GitHub Issues para bugs e melhorias

---

## 8. Próximos Passos Imediatos

### Esta Semana (19-25/01) - Sprint 1

1. **Segunda-feira (19/01)**:
   - Iniciar auditoria de RLS
   - Listar todas as tabelas e políticas
   - Criar documento de auditoria

2. **Terça-feira (20/01)**:
   - Adicionar staff à tabela `hostconnect_staff`
   - Criar página `/admin/staff-management`
   - Testar acesso cross-org

3. **Quarta-feira (21/01)**:
   - Implementar hook `usePermissions()`
   - Criar página `/settings/permissions`
   - Adicionar checks de permissão em ações críticas

4. **Quinta-feira (22/01)**:
   - Criar página `/admin/audit-log`
   - Validar que ações críticas estão sendo logadas
   - Adicionar filtros (org, usuário, ação, data)

5. **Sexta-feira (23/01)**:
   - Testes de isolamento multi-tenant
   - Criar 2 orgs de teste
   - Validar que não há vazamento de dados
   - Documentar resultados

---

## 9. Glossário Rápido

- **Organização**: Entidade raiz (cliente)
- **Propriedade**: Unidade física (hotel, pousada)
- **Acomodação**: Quarto individual
- **Tipo de Quarto**: Categoria comercial (Standard, Luxo)
- **Reserva (Booking)**: Compromisso de venda futuro
- **Estadia (Stay)**: Período físico no hotel (check-in até check-out)
- **Folio**: Extrato financeiro da estadia
- **Governança**: Setor de limpeza
- **PDV**: Ponto de Venda (consumos extras)
- **RLS**: Row Level Security (segurança de linha)
- **Multi-tenant**: Múltiplos clientes no mesmo sistema

---

## 10. Conclusão

Este documento serve como **guia completo** para o orquestrador GPT implementar a **Fase 1** do HostConnect. Siga as diretrizes, prioridades e checklists para garantir um sistema **seguro, funcional e profissional**.

**Boa sorte e bom código! 🚀**
