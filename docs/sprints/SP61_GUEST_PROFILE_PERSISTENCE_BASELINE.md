# SP61 - Guest Profile Persistence Baseline

## Objective
Create the internal persistence baseline for canonical guest profiles.

## Scope
- Added canonical guest identity contracts (`orgId` required, `propertyId` aware).
- Added internal persistence adapter with normalization/dedup placeholders.
- Added queue/event compatible persistence layer with correlationId propagation.
- Added module exports for reuse by segmentation and loyalty layers.

## Delivered Files
- `src/modules/guestIntelligence/GuestProfileTypes.ts`
- `src/modules/guestIntelligence/GuestProfilePersistenceAdapter.ts`
- `src/modules/guestIntelligence/GuestProfilePersistenceLayer.ts`
- `src/modules/guestIntelligence/index.ts`

## Safety
- Internal-only baseline.
- No DB changes.
- No external providers.
- No PMS runtime changes.

## Sprint Verdict
PASS
