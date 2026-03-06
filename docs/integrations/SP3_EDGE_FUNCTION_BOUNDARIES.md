# SP3 Edge/API Boundary Specification

## Scope
This document defines safe boundaries for Edge Functions and API contracts used by Host Connect integration flows.

## Boundary Principles
- Edge/API must validate auth context before business logic.
- Tenant context (`org_id`, `property_id`) must be explicit in request path/body/context.
- Responses must not expose cross-tenant records.
- Function behavior must be deterministic for identical inputs.

## Boundary Map
| Boundary | Input Contract | Output Contract | Auth Required | Tenant Enforcement |
|---|---|---|---|---|
| Public booking/pre-checkin endpoints | tokenized request + minimal payload | scoped booking/pre-checkin data | token or anonymous scoped token | token scope + RLS |
| Operational CRUD endpoints (rooms/services/amenities/categories) | tenant-scoped IDs + validated payload | mutated resource + audit metadata | authenticated user/session | RLS + org/property predicates |
| Reporting endpoints | date range + optional status/type filters | aggregated metrics + rowset | authenticated user/session | RLS + selected property/org |
| Integration callbacks (Reserve/Portal) | signed/system credentials + contract payload | ack/error envelope | service-to-service | contract-level tenant key + DB RLS |

## Security Checks per Boundary
- Request schema validation (required fields, type, enum).
- Authorization check (role and tenant membership).
- Scope check (`org_id`/`property_id` alignment with session/contract).
- Output minimization (no internal secrets/irrelevant columns).

## Contract Test Expectations
- Positive: valid payload + valid tenant returns expected result.
- Negative: cross-tenant key must return empty/forbidden.
- Negative: missing tenant fields must fail validation.
- Negative: unauthorized role must fail write operations.

## Observability Requirements
- Emit `trace_id` for each integration request.
- Log contract version and boundary name.
- Never log credentials, tokens, or full PII.
