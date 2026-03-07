# SP54 - Campaign Attribution Metrics

## Objective

Create derived campaign attribution analytics baselines combining campaign/source/medium with reservation and revenue placeholders.

## Scope

- Extend analytics contracts for campaign attribution metrics
- Add internal adapter to derive/store metrics placeholders
- Add campaign metrics layer with:
  - feature flag guard
  - correlationId traceability
  - Outbox/EventBus compatibility
  - retry-compatible processing
- Expose baseline outputs for:
  - revenue by campaign
  - reservation count by campaign
  - conversion rate placeholder
  - revenue per source
  - revenue per medium

## Deliverables

- `src/integrations/analytics/types.ts` (campaign metrics contracts)
- `src/integrations/analytics/internalCampaignMetricsAdapter.ts`
- `src/integrations/analytics/campaignMetricsLayer.ts`
- `src/integrations/analytics/index.ts` update
- `docs/qa/SP54/*`

## Out of Scope

- Real ad platform calls
- DB changes
- PMS runtime flow changes
