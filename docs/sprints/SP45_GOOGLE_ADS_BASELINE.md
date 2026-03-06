# SP45 - Google Ads Baseline

Date: 2026-03-06
Phase: 18 - Paid Traffic Integrations
Status: COMPLETED

## Goal

Introduce a safe architecture baseline for Google Ads integration without real provider connectivity.

## Scope

- Added a dedicated paid traffic integration module.
- Added Google Ads command/event contracts with tenant-safe context.
- Added internal baseline adapter for in-memory campaign upsert snapshot.
- Added queue-first integration layer using Outbox and EventBus.
- Added feature flag guard and payload validation gate.
- Added correlationId propagation and retry compatibility.

## Out of Scope

- Real Google Ads API calls.
- Credentials, OAuth flows, or provider SDK coupling.
- Persistent storage or BI attribution logic.

## Architecture Guarantees

- Multi-tenant isolation (`orgId` required, `propertyId` optional).
- Queue-first flow (event -> outbox -> event bus -> adapter).
- Adapter isolation from provider SDKs.
- Correlation traceability through command/event/record.
- Retry and DLQ compatibility via integration hub primitives.
- Feature-flag controlled rollout.

## Main Files

- `src/integrations/paidTraffic/types.ts`
- `src/integrations/paidTraffic/internalGoogleAdsAdapter.ts`
- `src/integrations/paidTraffic/googleAdsBaselineLayer.ts`
- `src/integrations/paidTraffic/index.ts`
