# SP16 Subscription Lifecycle Baseline

## Objective
Entregar baseline operacional de lifecycle de assinatura com regras de transicao explicitas e visibilidade no painel.

## Delivered
- Engine de lifecycle em `src/lib/monetization/subscriptionLifecycle.ts`:
  - normalizacao de `plan_status`
  - derivacao de status efetivo
  - matriz de transicoes permitidas
  - validacao de transicao por evento
- Hook `useSubscriptionLifecycle`:
  - carrega owner profile (`plan`, `plan_status`, `trial_expires_at`)
  - consolida sinais de invoices (`overdue`, `outstanding`)
  - retorna transicoes permitidas e exemplos bloqueados
- Atualizacao de `useEntitlements`:
  - passa a usar snapshot canonico de lifecycle para hardening de decisao de plano
  - aplica downgrade seguro para `free` em estados bloqueados (`suspended`, `cancelled`)
- Nova pagina protegida:
  - `SubscriptionLifecyclePage` em `/billing/subscription-lifecycle`
  - menu no grupo `Financeiro`

## No-DB Change Statement
- SP16 nao introduz migrations.
- Sem DDL/DML e sem alteracao manual em banco.

## Operational Impact
- Reduz ambiguidade entre status bruto e status efetivo.
- Evita transicoes inconsistentes no fluxo de assinatura.
- Melhora triagem de risco financeiro (trial/grace/suspension).

