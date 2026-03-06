# FNRH Payload Model (SP49)

Date: 2026-03-06
Status: Proposed mapping model only

## Goal

Define the canonical payload model that Host Connect should generate before FNRH adapter submission.

## Canonical model proposal

```json
{
  "tenant": {
    "orgId": "string",
    "propertyId": "string"
  },
  "correlationId": "string",
  "idempotencyKey": "string",
  "lifecycleStage": "pre_checkin|checkin|checkout",
  "reservation": {
    "reservationId": "string",
    "externalReservationId": "string|null",
    "checkInDate": "YYYY-MM-DD",
    "checkOutDate": "YYYY-MM-DD"
  },
  "property": {
    "name": "string",
    "address": "string",
    "city": "string",
    "state": "UF",
    "country": "ISO-3166 alpha-2|alpha-3",
    "postalCode": "string"
  },
  "guest": {
    "fullName": "string",
    "document": {
      "type": "CPF|PASSAPORTE|RNE|OUTRO",
      "number": "string"
    },
    "birthDate": "YYYY-MM-DD|null",
    "email": "string|null",
    "phone": "string|null",
    "nationality": "string|null",
    "address": {
      "street": "string|null",
      "number": "string|null",
      "complement": "string|null",
      "district": "string|null",
      "city": "string|null",
      "state": "string|null",
      "country": "string|null",
      "postalCode": "string|null"
    }
  },
  "fnrhPayload": {
    "dados_ficha": {}
  },
  "audit": {
    "createdAt": "ISO-8601",
    "source": "host_connect",
    "payloadVersion": "v1"
  }
}
```

## Transformation flow

1. Load tenant/property context (`orgId`, `propertyId`).
2. Load booking/reservation and property row.
3. Load guest identity from pre-checkin/guest records.
4. Normalize + validate fields.
5. Build canonical envelope.
6. Map canonical envelope to official FNRH `dados_ficha` structure.
7. Emit queue event for adapter processing.

## Field precedence strategy

For each guest field, use deterministic precedence:
1. Latest approved pre-checkin submission
2. `booking_guests` linked participant
3. `guests` master record
4. Booking fallback fields (`guest_name`, `guest_email`, `guest_phone`)

For reservation identifiers:
1. External reservation id (if available)
2. Internal booking id

For property data:
1. Compliance-configured property profile
2. `properties` table fields

## Missing-field behavior model

- `BLOCKING_MISSING`:
  - document number/type
  - guest full name
  - reservation id
  - required lifecycle date
  Action: reject auto-submit, route to manual compliance queue.

- `SOFT_MISSING`:
  - phone/email
  - non-mandatory address components
  Action: submit with null/default when official schema allows.

## PII masking policy in payload lifecycle

During logs/metrics:
- `document.number`: show only last 4 (e.g., `***1234`)
- `email`: mask local part (e.g., `m***@domain.com`)
- `phone`: mask middle digits
- Full payload body: never log raw; log hash only

At rest:
- Store encrypted payload and canonical envelope where retained.
- Restrict access by role and tenant scope.

## Compatibility constraints

- Model must remain queue-first and idempotent.
- No direct FNRH API dependency in core PMS.
- Adapter must be replaceable/mocked in non-prod environments.

## Out-of-scope in SP49

- Final code implementation of mapper/validator
- Live endpoint invocation
- DB schema changes
