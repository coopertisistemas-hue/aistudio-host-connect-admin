# SP70 - Availability Sync Baseline

## Objective
Create internal availability sync payload generation baseline using mapped entities.

## Scope
- Added availability sync contracts and feature flag guard (`availabilitySyncBaseline`).
- Added replay-safe/idempotent availability sync adapter.
- Added queue/event compatible availability sync layer consuming OTA mapping baseline.
- Updated module index exports.

## Safety
- Advisory/internal mode only.
- No provider calls.
- No direct PMS mutation.
- No DB changes.

## Sprint Verdict
PASS
