# SP11 Public API v1 Spec (Baseline)

## Contract Envelope
All public endpoints return:

```json
{
  "contract_version": "v1.0",
  "trace_id": "<uuid>",
  "code": "OK|<ERROR_CODE>",
  "data": {}
}
```

Error responses include:

```json
{
  "contract_version": "v1.0",
  "trace_id": "<uuid>",
  "code": "<ERROR_CODE>",
  "error": "<message>"
}
```

## Required Headers
- `x-api-version: v1.0`
- `x-api-scope`: endpoint-specific scope
- `x-client-id`: stable client identifier
- `x-public-api-key`: optional, required only when `website_settings.public_api_key` exists for target property

## Endpoints

### `check-availability` (POST)
- Scope: `public.booking.availability.read`
- Body:
  - `property_id` (uuid)
  - `room_type_id` (uuid)
  - `check_in` (date string)
  - `check_out` (date string)
  - `total_guests` (number)
- `data` payload:
  - `available` (boolean)
  - `remainingAvailableRooms` (number)
  - `message` (string)

### `calculate-price` (POST)
- Scope: `public.booking.pricing.read`
- Body:
  - `property_id` (uuid)
  - `room_type_id` (uuid)
  - `check_in` (date string)
  - `check_out` (date string)
  - `total_guests` (number)
  - `selected_services_ids` (optional uuid[])
- `data` payload:
  - `total_amount` (number)
  - `price_per_night` (number)
  - `number_of_nights` (number)

### `get-public-website-settings` (POST)
- Scope: `public.website.settings.read`
- Body:
  - `property_id` (uuid)
- `data` payload:
  - Key/value map restricted to safe allowlist

## Rate Limits (best-effort edge memory)
- `check-availability`: 45 req/min per `endpoint + client`
- `calculate-price`: 30 req/min per `endpoint + client`
- `get-public-website-settings`: 60 req/min per `endpoint + client`
- On exceed: `429 RATE_LIMITED` + `Retry-After` header

## Observability
- Structured logs with `event`, `trace_id`, `endpoint`, `code`.
- Error classes standardized:
  - `PAYLOAD_VALIDATION_FAILED`
  - `INVALID_IDENTIFIER`
  - `SCOPE_REQUIRED`
  - `API_KEY_INVALID`
  - `RATE_LIMITED`
  - `UNHANDLED_ERROR`
