# SP63 - Guest Loyalty / Recurrence Signals Baseline

## Objective
Generate internal loyalty and recurrence signals from persisted guest profiles and segmentation outputs.

## Scope
- Added loyalty/recurrence contracts and signal model.
- Added internal loyalty adapter for repeat-guest, frequency, LTV placeholder and preference placeholders.
- Added loyalty layer consuming SP61 persistence and SP62 segmentation snapshots.
- Updated module exports for consumer compatibility.

## Delivered Files
- `src/modules/guestIntelligence/GuestLoyaltyTypes.ts`
- `src/modules/guestIntelligence/GuestLoyaltyAdapter.ts`
- `src/modules/guestIntelligence/GuestLoyaltyLayer.ts`
- `src/modules/guestIntelligence/index.ts` (updated)

## Safety
- Internal signals only.
- No loyalty provider integration.
- No DB changes.
- No guest-facing automation changes.

## Sprint Verdict
PASS
