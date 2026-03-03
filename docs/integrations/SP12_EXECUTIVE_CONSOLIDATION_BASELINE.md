# SP12 Executive Consolidation Baseline (v1.0)

## Goal
Fornecer visão executiva consolidada multi-propriedade por organização para apoiar decisão de rede.

## Data Inputs (Org-scoped)
- `properties`: capacidade e status por unidade.
- `bookings`: receita e volume operacional.
- `expenses`: pressão de custo e pendências financeiras.

## KPIs Baseline
- Propriedades ativas
- Total de reservas
- Receita bruta consolidada
- Despesas consolidadas
- Resultado líquido consolidado
- Ocupação consolidada (estimativa mensal)

## Risk Signals
- Propriedades ativas sem reservas no período
- Quantidade de despesas vencidas (`payment_status = overdue`)

## Ranking Baseline
- Top 5 propriedades por receita
- Receita, reservas, despesas e líquido por propriedade

## Governance
- Todas as queries usam filtro `org_id`.
- Baseline SP12 é read-only e não altera esquema.
- Reporte preparado para evolução de dashboards executivos avançados (rede e portfolio).
