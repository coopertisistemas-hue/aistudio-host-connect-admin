# SP15 Monetization Console Baseline

## Objective
Deliver an operational console to monitor monetization health and revenue expansion signals.

## Delivered Baseline
- New hook: `useMonetizationConsole`
  - Loads org-scoped profile, members, invoices, properties, and pricing plans.
  - Computes KPIs, risk signals, plan mix, upgrade opportunities, and 6-month billing timeline.
- New page: `MonetizationConsolePage`
  - KPI cards (MRR, invoiced, paid, outstanding, delinquency).
  - Risk panel (overdue invoices, churn score, trial remaining).
  - Plan mix and upgrade opportunity panels.
  - CSV export for operational analysis.
- Navigation and route wiring:
  - Protected route: `/monetization/console`
  - Sidebar entry under `Financeiro`.

## Tenant Boundary
- Queries are scoped by `currentOrgId`.
- No multi-org joins or unscoped reads.

## Known Limits (intentional for baseline)
- MRR baseline uses plan pricing fallback when pricing plan name match is unavailable.
- Churn risk score is heuristic and should evolve with historical payment signals.
- Timeline is aggregate-only (no cohort breakdown yet).

## Next Iteration Suggestions
1. Persist indicator snapshots for trend analytics.
2. Add property-level segmentation under strict tenant contract.
3. Add alerting thresholds integrated with notification workflows.

