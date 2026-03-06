# FNRH Validation Rules (SP49)

Date: 2026-03-06
Status: Design baseline for validation and compliance enforcement

## Validation objectives

- Prevent invalid legal submission payloads
- Protect LGPD-sensitive data
- Preserve traceability and retry safety

## Rule categories

## 1) Structural rules

1. `tenant.orgId` required
2. `tenant.propertyId` required for FNRH submission routing
3. `correlationId` required
4. `idempotencyKey` required and deterministic
5. `lifecycleStage` in allowed set (`pre_checkin`, `checkin`, `checkout`)

## 2) Reservation/stay rules

1. `reservation.reservationId` required
2. `checkInDate` and `checkOutDate` must be valid dates
3. `checkOutDate >= checkInDate`
4. Stage-specific date rule:
   - `pre_checkin`: date may be future
   - `checkin`: current/past check-in accepted by policy
   - `checkout`: checkout date required and >= check-in

## 3) Guest identity rules

1. `guest.fullName` required; min length >= 3 after trim
2. `guest.document.type` required
3. `guest.document.number` required and normalized
4. CPF validation when type = `CPF` (checksum rule)
5. Passport/RNE format baseline validation for non-CPF docs
6. `birthDate` required when official schema marks mandatory for case

## 4) Contact and address rules

1. Email format validation when provided
2. Phone normalization to E.164 when possible
3. Country/state normalization for property and guest addresses
4. Postal code normalization to numeric canonical form for BR context when required

## 5) Compliance and security rules

1. Raw PII must never be written to standard logs
2. Request/response logging stores hash + metadata (not full body)
3. Payload encryption required for retained records
4. Role-based access required for replay/review tools

## 6) Retry and idempotency rules

1. Same `idempotencyKey` must produce at-most-once external submission intent
2. Retry only transient failures (network, 5xx, timeout)
3. Non-retryable validation/auth errors routed to manual queue
4. DLQ required after retry exhaustion

## Rule severity matrix

| Severity | Meaning | Example |
|---|---|---|
| `BLOCK` | Do not submit | Missing document number |
| `WARN` | Submit allowed with warning | Missing optional phone |
| `INFO` | Non-blocking telemetry | Fallback source used |

## Fallback strategy for missing fields

1. Apply source precedence chain (pre-checkin -> booking_guests -> guests -> bookings).
2. If required field still missing:
   - mark validation as `BLOCK`
   - send to manual compliance queue
   - create actionable operator task with missing-field list
3. If optional field missing:
   - set null/default as allowed
   - attach `WARN` metadata

## Normalization rules

- Trim whitespace for all string inputs
- Collapse repeated internal spaces in names
- Remove punctuation from numeric documents before validation
- Keep display-safe masked variants for UI/audit views
- Convert all dates to ISO `YYYY-MM-DD` for FNRH payload
- Normalize phone by country rules (BR default +55 when inferred safely)

## PII classification and masking policy

### Classification

- `Restricted-PII`:
  - full name
  - document number/type
  - birthdate
  - email/phone
  - address fields linked to identifiable guest

- `Sensitive-operational`:
  - property credentials
  - auth tokens
  - integration responses with identifiers

### Masking policy

- Document: `***` + last 4
- Email: first char + `***` + domain
- Phone: keep country and last 2-4 only
- Address: city/state allowed in logs; full street masked

## Validation output contract (proposed)

```json
{
  "valid": false,
  "severity": "BLOCK",
  "errors": [
    {
      "field": "guest.document.number",
      "code": "REQUIRED_MISSING",
      "message": "Guest legal document is mandatory"
    }
  ],
  "warnings": [],
  "normalized": {}
}
```

## Operational recommendation

Adopt pre-submit validation as mandatory gate in future FNRH layer; no payload should enter adapter without passing `BLOCK` rules.
