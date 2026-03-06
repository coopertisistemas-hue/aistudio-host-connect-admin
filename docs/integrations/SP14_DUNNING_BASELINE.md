# SP14 Dunning Baseline

## Objective
Estabelecer baseline operacional para recuperação de receita a partir de inadimplência de invoices.

## Inputs
- `invoices` por propriedade/organização
- `bookings` para sinal de risco de checkout sem invoice pago

## KPIs
- `bookedValue`
- `invoicedValue`
- `paidValue`
- `outstandingValue`
- `collectionRate`
- `deltaBookedVsInvoiced`
- `deltaInvoicedVsPaid`
- `checkedOutWithoutPaidInvoice`

## Operational Queue
- D0/D3: lembrete e validação de meio de pagamento
- D7: escalonamento para financeiro
- D14+: ação crítica de retenção/comercial

## Exports
- CSV de eventos de billing para reconciliação externa e auditoria operacional.

## Safety
- Sem escrita em banco no baseline SP14.
- Todas as leituras filtradas por `org_id` + `property_id`.
