# SP3 Integration Contract Matrix (Host <-> Reserve <-> Portal)

## Purpose
Define integration boundaries, ownership, and compatibility rules for the Connect ecosystem without introducing unready runtime coupling.

## System Roles
- Host Connect (Host): operational source for property setup, inventory, operational events, and booking fulfillment state.
- Reserve (Reserve): conversion and reservation orchestration domain.
- Portal (Portal): discovery and user-facing search/selection flows.

## Contract Governance
- Contract versioning: `MAJOR.MINOR`.
- Backward compatibility: required for all `MINOR` changes.
- Breaking changes: only via new `MAJOR` contract and explicit migration plan.
- Tenant context is mandatory in every tenant-scoped contract (`org_id`, `property_id` where applicable).

## Contract Matrix
| Producer | Consumer | Contract | Direction | Required Fields | Auth Context | Compatibility Rule |
|---|---|---|---|---|---|---|
| Portal | Reserve | AvailabilitySearch.v1 | Request | `property_id?`, dates, occupancy params | end-user/session | additive filters only |
| Reserve | Host | ReservationCreate.v1 | Request | `org_id`, `property_id`, guest + stay payload | service-to-service | new optional fields only |
| Host | Reserve | ReservationLifecycle.v1 | Event/Callback | `org_id`, `property_id`, `booking_id`, `status`, timestamps | service-to-service | status enum extension requires MINOR |
| Host | Portal | PropertyCatalogSync.v1 | Feed | `property_id`, metadata, media refs, availability summary | service-to-service | no removal/rename in MINOR |
| Host | Portal | PricingSummary.v1 | Feed | `property_id`, date window, rates/fees summary | service-to-service | additive only |
| Reserve | Portal | ReservationOutcome.v1 | Event | reservation id, success/failure, reason codes | service-to-service | reason code additions only |

## Canonical Identity Rules
- `org_id` is the tenant authority key.
- `property_id` is the operational scope key.
- `booking_id` is unique per tenant scope and must be traceable across systems.

## Error Contract Baseline
All integration endpoints/events must map to a normalized error envelope:
- `code` (stable, machine-readable)
- `message` (human-readable)
- `context` (safe metadata, no secrets)
- `trace_id` (cross-system correlation)

## Non-Negotiables
- No implicit tenant inference across boundaries.
- No consumer-side authorization assumptions.
- No data broadening beyond declared contract fields.
