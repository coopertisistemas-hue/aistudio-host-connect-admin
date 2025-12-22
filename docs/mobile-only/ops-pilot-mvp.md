# Host Connect — Mobile Only (Piloto) — Operações + Reservas + Financeiro
Data: 2025-12-22 (America/Sao_Paulo)
Escopo: Piloto Urubici Park Hotel + Casa do Vinho + Cantinho da Serra
Prioridade: Estabilidade + Processos operacionais completos no celular (mobile-only)

---

## 1) Objetivo
Entregar um mobile-only que funcione na prática para:
- Equipe (camareira, manutenção, copa, lavanderia): operação rápida, sem fricção.
- Gerente/Proprietário: visão objetiva + aprovações essenciais (vistoria, prioridades, caixa do dia).

Regra de ouro: 1 mão, 1 polegar, até 3 cliques para ação principal.

---

## 2) Não-objetivos (fora do piloto)
- DRE / contabilidade avançada / conciliação por canal / NF-e / repasses complexos
- Offline-first completo (fila de sync)
- Inventário completo de enxoval/amenities (entra pós-piloto)

---

## 3) Módulos do Mobile-only (MVP)
### Operações
1. Painel do Turno (Home Operacional)
2. Quartos (status + fluxo limpeza/vistoria)
3. Ocorrências (tickets: abrir → assumir → resolver → reabrir)
4. Copa (checklist por turno)
5. Lavanderia (coleta/entrega simples)

### Reservas (MVP)
6. Agenda do Dia (Chegadas / Saídas / Hóspedes no hotel)
7. Detalhe da Reserva (status + observações)
8. Ações: Check-in / Check-out (gerente/recepção)

### Financeiro (MVP)
9. Caixa do Dia (entradas/saídas + saldo do dia)
10. Pendências (a receber por reserva, quando aplicável)

---

## 4) Personas e Roles (permissões)
Roles mínimos do piloto:
- HOUSEKEEPING (camareira)
- MAINTENANCE (manutenção)
- PANTRY (copa)
- LAUNDRY (lavanderia)
- MANAGER (gerente/proprietário)
- (Opcional) FRONTDESK (recepção, se existir no piloto)

Princípios de permissão:
- Equipe: vê o necessário operacional (quarto/local/status/horário). Não vê valores financeiros.
- Gerente: vê tudo e aprovações (vistoria, prioridades, caixa, pendências).

---

## 5) Estados (status) — definição canônica do piloto
### 5.1 Quartos (room_status)
- DIRTY (Sujo)
- CLEANING (Em limpeza)
- INSPECTION (Aguardando vistoria)
- READY (Pronto)
- BLOCKED (Bloqueado / Manutenção)

### 5.2 Ocorrências (ticket_status)
- OPEN (Aberta)
- ASSIGNED (Assumida)
- IN_PROGRESS (Em andamento)
- RESOLVED (Resolvida)
- REOPENED (Reaberta)
- CANCELED (Cancelada - uso raro)

Prioridade:
- LOW / MEDIUM / HIGH / CRITICAL

### 5.3 Reservas (reservation_status)
- CONFIRMED (Confirmada)
- CHECKED_IN (Check-in)
- CHECKED_OUT (Check-out)
- CANCELED (Cancelada)
- NO_SHOW (opcional pós-piloto)

### 5.4 Pagamento (payment_status) — mínimo
- PENDING
- PARTIAL
- PAID

---

## 6) Navegação (mobile-only)
Rota base: /m

Home (Painel do Turno) contém 3 blocos:
1) Operação (quartos + ocorrências)
2) Reservas (chegadas/saídas do dia)
3) Financeiro (somente MANAGER)

Menu inferior (tab bar) sugerido:
- Home
- Quartos
- Ocorrências
- Reservas
- (Gerente) Financeiro

---

## 7) Fluxos por módulo (passo a passo)

### 7.1 Painel do Turno (Home Operacional)
**Equipe**
1. Abre /m
2. Vê “Minhas tarefas / meus quartos”
3. Ação principal: entrar no quarto ou abrir ocorrência

**Gerente**
1. Abre /m
2. Vê contadores: Pronto / Em limpeza / Vistoria / Bloqueado
3. Vê chegadas/saídas do dia
4. Vê caixa do dia + pendências

Critério: Home não pode “pesar”. Listas curtas + “ver tudo”.

---

### 7.2 Quartos (limpeza e vistoria)
**Camareira (HOUSEKEEPING)**
1) Lista “Meus quartos” (ou “Quartos do dia” filtrável)
2) Abre quarto
3) Toca “Iniciar limpeza” → status = CLEANING
4) Marca checklist (rápido) + observação
5) Toca “Finalizar” → status = INSPECTION
6) Se houver problema: “Abrir ocorrência” já com quarto/local preenchido

**Gerente (MANAGER)**
1) Filtra por INSPECTION
2) Abre quarto
3) Aprovar → READY
4) Reprovar → CLEANING (com motivo)

---

### 7.3 Ocorrências (tickets)
**Qualquer equipe**
1) “Criar ocorrência”
2) Seleciona local (quarto/área)
3) Categoria + prioridade + descrição (curta)
4) Salvar → OPEN

**Manutenção (MAINTENANCE)**
1) Lista de ocorrências (prioridade e data)
2) “Assumir” → ASSIGNED
3) “Iniciar” → IN_PROGRESS
4) “Resolver” → RESOLVED (com observação; foto opcional)

**Gerente**
- Pode alterar prioridade
- Pode reabrir (REOPENED) se não ficou ok

---

### 7.4 Reservas (Agenda do Dia)
**Equipe (leitura)**
1) Acessa Reservas > Agenda do dia
2) Vê Chegadas / Saídas (sem valores)
3) Toca numa reserva → vê quarto + horários + observações
4) Atalho “Ver quarto” abre módulo Quartos

**Gerente/Recepção**
1) Marca Check-in → status CHECKED_IN
2) Marca Check-out → status CHECKED_OUT
3) Observações (late check-in, berço, alergias etc.)

---

### 7.5 Financeiro (Caixa do Dia) — gerente
1) Abre Financeiro
2) Vê: Recebido hoje / Despesas hoje / Saldo do dia / Pendências
3) “Novo lançamento”:
   - Entrada ou Saída
   - Categoria
   - Forma (pix/cartão/dinheiro/transferência)
   - Valor
   - Observação
   - (Opcional) vincular a reserva
4) Pendências:
   - lista de reservas com payment_status PENDING/PARTIAL

---

### 7.6 Copa (Checklist)
1) Lista do turno
2) Marcar concluído + observação
Critério: rápido, sem burocracia.

---

### 7.7 Lavanderia (Coleta/Entrega)
1) Registrar coleta (quantidade/sacos + unidade + horário)
2) Registrar entrega (confirmação + observação)
Critério: ciclo simples, sem inventário completo.

---

## 8) Matriz de Permissões (MVP)
- HOUSEKEEPING:
  - Quartos: atualizar status (DIRTY→CLEANING→INSPECTION), ver histórico
  - Ocorrências: criar e ver; não altera prioridade
  - Reservas: leitura (sem valores)
  - Financeiro: sem acesso

- MAINTENANCE:
  - Ocorrências: assumir/iniciar/resolver
  - Quartos: leitura + pode bloquear (BLOCKED) se necessário (opcional no piloto)
  - Reservas: leitura (sem valores)
  - Financeiro: sem acesso

- PANTRY / LAUNDRY:
  - Checklists/ciclos: marcar concluído
  - Reservas: leitura (sem valores)
  - Financeiro: sem acesso

- MANAGER:
  - Tudo + aprova vistoria + altera prioridade + financeiro completo

---

## 9) Regras de estabilidade (não negociáveis)
- Listas paginadas/limitadas (evitar carregar “o mundo”)
- Loading state e Empty state em todas telas
- Falhas de rede: mensagem humana + “Tentar novamente”
- Logs de erro (Supabase-only) no padrão premium

---

## 10) QA do Piloto (roteiro de corredor — 3 min)
1) Camareira: quarto → iniciar → finalizar → INSPECTION
2) Gerente: INSPECTION → aprovar → READY
3) Camareira: abrir ocorrência no quarto
4) Manutenção: assumir → IN_PROGRESS → RESOLVED
5) Gerente: reabrir (REOPENED) opcional
6) Reservas: ver chegadas/saídas do dia
7) Financeiro: lançar entrada e saída; conferir saldo
8) Copa: marcar 3 itens
9) Lavanderia: coleta e entrega

Definition of Done (Piloto):
- Fluxos acima completos sem crash
- Dados persistem e refletem em todas listas
- Permissões respeitadas (equipe não vê valores)
