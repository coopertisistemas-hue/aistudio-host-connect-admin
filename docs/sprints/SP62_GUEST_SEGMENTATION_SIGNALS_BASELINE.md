# SP62 - Guest Segmentation Signals Baseline

## Objective
Generate deterministic and explainable guest segmentation signals from persisted guest profiles.

## Scope
- Added recency/frequency/value bucket segmentation contracts.
- Added internal segmentation adapter with deterministic rules.
- Added segmentation layer consuming SP61 persistence snapshot.
- Added module exports for downstream loyalty/recommendation compatibility.

## Delivered Files
- `src/modules/guestIntelligence/GuestSegmentationTypes.ts`
- `src/modules/guestIntelligence/GuestSegmentationAdapter.ts`
- `src/modules/guestIntelligence/GuestSegmentationLayer.ts`
- `src/modules/guestIntelligence/index.ts` (updated)

## Safety
- Internal signals only.
- No provider calls.
- No DB changes.
- No guest-facing activation.

## Sprint Verdict
PASS
