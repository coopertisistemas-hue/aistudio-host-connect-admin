# SP47 - Attribution Engine Baseline

## Objective

Implement the internal attribution engine baseline for paid traffic, enabling campaign/source/medium touchpoint tracking and future lead/reservation linkage placeholders without real provider calls.

## Scope

- Extend paid traffic contracts with attribution types/events
- Add internal attribution adapter
- Add attribution engine layer with:
  - feature flag guard
  - correlationId traceability
  - outbox/event-bus compatibility
  - retry-compatible processing
- Keep implementation internal-only and tenant/property-safe

## Deliverables

- `src/integrations/paidTraffic/internalAttributionAdapter.ts`
- `src/integrations/paidTraffic/attributionEngineLayer.ts`
- `src/integrations/paidTraffic/types.ts` (attribution contracts)
- `src/integrations/paidTraffic/index.ts` (exports)
- `docs/qa/SP47/*`
- `docs/milestones/PHASE_18_REPORT.md` update

## Out of Scope

- Real provider API integrations
- Database schema changes
- PMS runtime flow changes
