# FNRH Data Requirements (SP48)

Date: 2026-03-06
Scope: Discovery baseline for data contracts and compliance controls

## Sources

- Portaria MTur 6/2024 (Annexes and operational obligations)
- API PMS Manual v2.2 (routes, request examples, query requirements)

## 1) Core data domains required

Regulatory + API discovery indicates these data groups are required:

1. Establishment / legal registration context
- Cadastur-linked property identity
- Operator context for authorized submission

2. Guest personal identification
- Full identity details (domestic/foreign documents)
- Nationality and related civil data attributes as required by annex schema

3. Stay context
- Reservation/check-in identifiers
- Dates and lifecycle progression (pre-checkin -> check-in -> checkout)

4. Operational metadata
- Submission timestamp
- Integration identifiers for traceability

## 2) API request requirements observed

Manual-level requirements identified:
- Query params for list/search operations:
  - `cpf_solicitante`
  - `numero_reserva` (for pre-checkin lists)
  - date window params (`data_inicio`, `data_fim`) depending on route
- Body wrapper for registration path:
  - `dados_ficha`

## 3) Data classification (LGPD-oriented)

Recommended classification for Host Connect:

- `Restricted-PII` (high sensitivity):
  - full name
  - identification document numbers
  - birth/date-of-birth related fields
  - nationality + civil attributes when identifiable
  - stay records tied to identifiable guest

- `Operational-sensitive`:
  - property credential references
  - API tokens
  - submission trace metadata

Control requirements:
- Encryption in transit and at rest
- Field-level masking in logs
- Least-privilege access by role
- Explicit retention and deletion policy mapping

## 4) Minimal canonical data model (Host Connect side)

Recommended internal canonical envelope before adapter mapping:

- Tenant scope:
  - `orgId`
  - `propertyId`

- FNRH submission scope:
  - `fnrhLifecycleStage` (`pre_checkin`, `checkin`, `checkout`)
  - `reservationId`
  - `submissionReference`
  - `payloadVersion`

- Guest scope:
  - identity/document block
  - contact block (only fields required by official schema)
  - stay block (arrival/departure and room context)

## 5) Validation requirements before submission

Recommended validation gates:
- Required-field completeness against current FNRH schema version
- Document format validation (domestic/foreign variants)
- Date consistency (`checkOut >= checkIn`)
- Property credential/profile availability for tenant context

## 6) Data retention and audit expectations

Recommended compliance records per submission:
- tenant + property identity
- lifecycle stage
- payload hash
- endpoint
- response status/body hash
- correlationId
- attempt number and retry timeline

## 7) Multi-property requirements

Mandatory handling:
- Data segregation by `orgId` and `propertyId`
- Separate credentials/config per property
- No shared submission queue across properties without strict partitioning

## 8) Open data questions (for implementation phase)

- Final canonical mapping to each Annex I field name/enum
- Foreign document edge cases and fallback behavior
- Legal retention period confirmation with legal/compliance stakeholders
