# SP12 Marketplace Foundation Contract (v1.0)

## Purpose
Estabelecer baseline operacional para marketplace de experiências com isolamento tenant, catálogo property-scoped e reconciliação financeira mínima.

## Scope Keys
- `org_id` obrigatório para toda operação interna.
- `property_id` obrigatório para catálogo e venda de experiências.
- Sem leitura/escrita cross-tenant.

## Foundation Objects
- Catálogo base: serviços property-scoped (`services`) reutilizados como experiências iniciais.
- Sinal operacional: volume de reservas no escopo (`bookings`) para estimativa de attach-rate.
- Sinal financeiro: receita estimada de experiências para baseline de comissionamento.

## Contract Outputs
- `contractVersion`: `v1.0`
- `controls[]`:
  - `tenant_scope`
  - `catalog_readiness`
  - `reconciliation`
- `metrics`:
  - `publishedExperiences`
  - `draftExperiences`
  - `monthlyBookings`
  - `estimatedAttachRevenue`
- `experiences[]`:
  - `id`, `name`, `price`, `status`

## Control Rules
- `tenant_scope`: PASS somente com `org_id` + `property_id` válidos.
- `catalog_readiness`: PASS quando há pelo menos 1 experiência ativa.
- `reconciliation`: PASS quando há volume de reservas no escopo para baseline financeiro.

## Governance Notes
- SP12 não introduz novas tabelas no baseline; usa estruturas existentes para reduzir risco e acelerar adoção.
- Evolução para marketplace completo (parceiros, split e settlement formal) deve entrar com migrations dedicadas na próxima fase.
