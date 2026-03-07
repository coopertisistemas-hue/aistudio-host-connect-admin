# SP72 - Reservation Ingestion Baseline

## Objective
Create internal inbound reservation ingestion baseline with replay-safe/idempotent contract.

## Scope
- Added canonical inbound reservation contracts and feature flag guard (`reservationIngestionBaseline`).
- Added ingestion adapter with idempotency key generation.
- Added queue/event compatible reservation ingestion layer with no runtime side effects.
- Updated module index exports.

## Safety
- Internal baseline only.
- No reservation creation in PMS runtime.
- No operational side effects.
- No DB changes.

## Sprint Verdict
PASS
