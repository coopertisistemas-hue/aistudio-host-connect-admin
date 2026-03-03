# SP18 Revenue Assurance Reconciliation Contract (v1.0)

## Purpose
Definir o contrato final de reconciliacao entre assinatura, faturamento e pagamento para decisao operacional de fechamento.

## Reconciliation Axes
1. `subscription x invoice`
- assinatura em estado bloqueado (`suspended|cancelled`) com backlog financeiro deve gerar `NO_GO`.
- assinatura ativa com inadimplencia controlada permanece elegivel para `GO` condicionado.

2. `invoice x payment`
- calcular `deltaInvoicedVsPaid`.
- classificar risco por outstanding e volume de invoices vencidas.

3. `booking x invoice`
- detectar bookings ativas sem invoice.
- detectar checkout concluido sem invoice pago.
- detectar invoice paga sem booking vinculado.

## Leakage Signals (baseline)
- `BOOKING_WITHOUT_INVOICE` (high)
- `CHECKOUT_WITHOUT_PAYMENT` (high)
- `PAID_INVOICE_WITHOUT_BOOKING` (medium)
- `HIGH_OUTSTANDING_RATE` (medium)

## GO / NO-GO Rule
- `NO_GO` quando qualquer condição crítica ocorrer:
  - subscription efetiva em `suspended` ou `cancelled`
  - bookings sem invoice > 0
  - checkout sem invoice pago > 0
  - invoices vencidas >= 5
- `GO` quando não houver bloqueios críticos.

## Tenant Guardrails
- Todas as consultas no escopo de `org_id` e `property_id` selecionada.
- Sem agregacao cross-tenant.

