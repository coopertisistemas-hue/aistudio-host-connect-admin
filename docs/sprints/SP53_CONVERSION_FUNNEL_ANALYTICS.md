# SP53 - Conversion Funnel Analytics

## Objective

Create funnel analytics baseline structures connecting campaign -> click -> lead -> reservation, compatible with attribution and queue-first processing.

## Scope

- Extend analytics contracts for funnel stages:
  - impression placeholder
  - click
  - lead
  - reservation
- Add internal funnel adapter with tenant-safe in-memory placeholders
- Add funnel layer with Outbox/EventBus compatibility, feature flag guard and correlationId support

## Deliverables

- `src/integrations/analytics/types.ts` (funnel contracts)
- `src/integrations/analytics/internalConversionFunnelAdapter.ts`
- `src/integrations/analytics/conversionFunnelLayer.ts`
- `src/integrations/analytics/index.ts` update
- `docs/qa/SP53/*`

## Out of Scope

- Provider API calls
- DB schema changes
- PMS runtime behavior changes
