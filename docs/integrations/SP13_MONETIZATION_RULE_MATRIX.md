# SP13 Monetization Rule Matrix (v1.0)

## Objective
Definir matriz de decisão de monetização para acesso a módulos, separando claramente bloqueio por plano vs bloqueio por permissão.

## Decision Outputs
- `allowed`
- `upgrade_required` (bloqueado por plano)
- `permission_denied` (plano permite, usuário não possui permissão)

## Decision Order
1. **Plan check**: se o plano não permite o módulo => `upgrade_required`.
2. **Role check**: `owner/admin` => `allowed`.
3. **Permission check**: permissão explícita `false` => `permission_denied`.
4. Caso contrário => `allowed`.

## Module Baseline by Plan
- `free`: `tasks` apenas; sem `financial`, `otas`, `gmb`, `site_bonus`, `ai_assistant`, `ecommerce`.
- `basic`: libera `financial` e `otas`.
- `pro`: adiciona `gmb` e `ai_assistant`.
- `premium/founder`: libera todos os módulos baseline.

## Audit Trail (Client-side Buffer)
- Cada decisão registra:
  - `moduleKey`
  - `decision`
  - `plan`
  - `role`
  - `source` (`plan|role|permission`)
  - `occurredAt`
- Armazenamento circular local (`entitlement_audit_buffer_v1`, limite 120 eventos).

## Governance Notes
- Nenhuma decisão de monetização deve confiar apenas em gating visual.
- SP13 foca consistência de decisão em frontend; enforcement crítico continua no backend/RLS/triggers já existentes.
