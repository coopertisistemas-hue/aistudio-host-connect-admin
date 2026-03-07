# SP52 - Revenue Metrics Baseline

## Objective

Create the internal revenue metrics aggregation baseline, producing tenant-safe and property-scoped placeholders for revenue intelligence without changing PMS runtime or database schema.

## Scope

- New module: `src/integrations/analytics/`
- Revenue metrics contracts and placeholders for:
  - total reservations
  - total revenue
  - ADR
  - occupancy signal placeholder
  - revenue by property
  - revenue by period
  - reservation count per channel placeholder
- Internal in-memory adapter
- Queue-first, event-driven aggregation layer with feature flag guard

## Deliverables

- `src/integrations/analytics/types.ts`
- `src/integrations/analytics/internalRevenueMetricsAdapter.ts`
- `src/integrations/analytics/revenueMetricsLayer.ts`
- `src/integrations/analytics/index.ts`
- `docs/qa/SP52/*`

## Out of Scope

- Dashboards
- Real provider integration
- DB migrations
- PMS runtime behavior changes
