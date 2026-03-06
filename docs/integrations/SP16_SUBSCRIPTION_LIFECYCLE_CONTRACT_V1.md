# SP16 Subscription Lifecycle Contract (v1.0)

## Purpose
Padronizar estados e transicoes de assinatura para operacao SaaS auditavel e previsivel.

## Canonical Statuses
- `trial`
- `active`
- `grace`
- `suspended`
- `cancelled`

## Normalization Rules
- Aliases aceitos para compatibilidade:
  - `grace_period`, `past_due` -> `grace`
  - `blocked` -> `suspended`
  - `canceled`, `inactive` -> `cancelled`
- Valor ausente/invalido: fallback seguro para `active`.

## Derivation Rules (effective status)
1. `trial` expirado:
- com pendencia financeira (`overdue > 0` ou `outstanding > 0`) -> `grace`
- sem pendencia -> `active`
2. `active` com pendencia financeira -> `grace`
3. `grace` com risco elevado (`overdue >= 3`) -> `suspended`
4. demais casos: mantem status de origem.

## Allowed Transitions (event-driven)
- `trial`:
  - `trial_expired` -> `grace`
  - `payment_succeeded` -> `active`
  - `cancel_requested` -> `cancelled`
- `active`:
  - `payment_failed` -> `grace`
  - `manual_suspend` -> `suspended`
  - `cancel_requested` -> `cancelled`
- `grace`:
  - `payment_succeeded` -> `active`
  - `grace_expired` -> `suspended`
  - `cancel_requested` -> `cancelled`
- `suspended`:
  - `payment_succeeded` -> `active`
  - `manual_resume` -> `active`
  - `cancel_requested` -> `cancelled`
- `cancelled`:
  - `reactivated` -> `active`

## Blocked Transition Examples
- `cancelled + payment_succeeded -> active` (requer evento `reactivated`)
- `active + trial_started -> trial`
- `suspended + trial_started -> trial`

## Tenant Guardrails
- Todos os indicadores e decisoes devem ser calculados no escopo de `org_id`.
- Nenhuma operacao pode ler ou inferir estado de assinatura de outro tenant.

