# SP14 Billing Event Contract (v1.0)

## Purpose
Definir contrato operacional de eventos de cobrança para suporte ao ciclo de billing + dunning + reconciliação.

## Event Schema
- `eventType`:
  - `billing.payment.pending`
  - `billing.payment.partial`
  - `billing.payment.paid`
  - `billing.payment.failed`
  - `billing.payment.cancelled`
- `invoiceId` (uuid)
- `bookingId` (uuid | null)
- `propertyId` (uuid)
- `amount` (number)
- `status` (`pending|partially_paid|paid|cancelled`)
- `retryStage` (`none|d0|d3|d7|d14`)
- `createdAt` (timestamp)

## Derivation Rules
- Status `paid` => `billing.payment.paid`.
- Status `cancelled` => `billing.payment.cancelled`.
- Status `partially_paid` sem atraso => `billing.payment.partial`.
- Status `pending|partially_paid` com atraso => `billing.payment.failed` + retry stage.
- Status `pending` sem atraso => `billing.payment.pending`.

## Dunning Stages
- `d0`: até 3 dias de atraso
- `d3`: 4 a 7 dias
- `d7`: 8 a 14 dias
- `d14`: acima de 14 dias

## Governance Notes
- Escopo obrigatório por `org_id` e `property_id`.
- Contrato v1 é derivado de `invoices` existentes (sem nova tabela nesta sprint).
- Evolução para stream persistente de eventos deve vir com migration dedicada em fase seguinte.
