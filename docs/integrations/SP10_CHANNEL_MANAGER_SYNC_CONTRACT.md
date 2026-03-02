# SP10 Channel Manager Sync Contract (v1.0)

## Purpose
Define the baseline contract for OTA synchronization (price/availability) with tenant-safe authorization, idempotency, retry semantics and operational observability.

## Endpoint
- Edge Function: `sync-ota-inventory`
- Method: `POST`
- Auth: Required (`Authorization: Bearer <jwt>`)

## Required Headers
- `Authorization`
- `x-idempotency-key` (recommended; fallback generated server-side)

## Request Body
```json
{
  "property_id": "uuid",
  "room_type_id": "uuid",
  "date": "YYYY-MM-DD",
  "price": 150.0,
  "availability": 4,
  "max_attempts": 2
}
```

Rules:
- At least one of `price` or `availability` must be provided.
- `max_attempts` bounded to 1..3 (default 2).
- Tenant scope is validated by property access under RLS.

## Response Body
```json
{
  "contract_version": "v1.0",
  "trace_id": "uuid",
  "idempotency_key": "string",
  "property_id": "uuid",
  "room_type_id": "uuid",
  "date": "YYYY-MM-DD",
  "success": true,
  "summary": {
    "total": 3,
    "success": 3,
    "failed": 0,
    "retryable_failed": 0
  },
  "results": [
    {
      "ota": "booking_com",
      "status": "success",
      "code": "SYNC_OK",
      "message": "Sync accepted",
      "retryable": false,
      "attempts": 1
    }
  ]
}
```

## Error Codes
- `AUTH_REQUIRED`: missing/invalid auth context.
- `TENANT_SCOPE_VIOLATION`: property not accessible for current user/org.
- `PAYLOAD_VALIDATION_FAILED`: missing/invalid payload fields.
- `UNHANDLED_ERROR`: unexpected edge function failure.

## OTA Result Codes
- `SYNC_OK`
- `CONFIG_MISSING_API_KEY`
- `VALIDATION_FAILED`
- `OTA_TIMEOUT`
- `OTA_429`
- `OTA_5XX`

## Retry Matrix
- `CONFIG_MISSING_API_KEY`: no retry
- `VALIDATION_FAILED`: no retry
- `OTA_TIMEOUT`: retryable
- `OTA_429`: retryable
- `OTA_5XX`: retryable

## Audit Requirements
- Every call returns `trace_id` for cross-system troubleshooting.
- Frontend must surface result status + code + attempts per OTA.
- No secrets/token values may be logged.
