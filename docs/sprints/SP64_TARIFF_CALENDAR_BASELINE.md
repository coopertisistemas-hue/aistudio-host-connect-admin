# SP64 - Tariff Calendar Baseline

## Objective
Create internal tariff calendar baseline with advisory-only entries and explainability metadata.

## Scope
- Added tariff calendar contracts and feature flag guard (`tariffCalendarBaseline`).
- Added internal adapter for calendar entry upsert/snapshot.
- Added queue/event compatible layer with correlationId propagation.
- Added module index exports.

## Safety
- Advisory-only outputs.
- No automatic pricing mutation.
- No DB changes.
- No PMS runtime behavior changes.

## Sprint Verdict
PASS
