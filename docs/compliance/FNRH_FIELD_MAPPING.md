# FNRH Field Mapping (SP49)

Date: 2026-03-06
Status: Design baseline (no integration code)

## Scope

Map Host Connect internal data structures to FNRH payload requirements identified in SP48.

## Internal source models considered

- `public.bookings` (confirmed in `src/integrations/supabase/types.ts`)
- `public.properties` (confirmed in `src/integrations/supabase/types.ts`)
- `pre_checkin_submissions.payload` (runtime shape from `PublicPreCheckinPage.tsx`)
- `guests` and `booking_guests` fields (runtime usage in `PreCheckinSubmissionsComponent.tsx`)
- `reservation_orchestration_events` (tracking/idempotency context)

## Host Connect -> FNRH mapping table (baseline)

| FNRH domain field | Required | Host Connect source | Transformation / rule | Fallback strategy |
|---|---|---|---|---|
| `estabelecimento.identificador` (Cadastur/profile) | Yes | Compliance tenant/property config (`orgId`, `propertyId`) | Resolve from property-level FNRH credential profile | Block submission if missing |
| `reserva.numero` | Yes | `bookings.id` (or external reservation id when available) | Normalize to string identifier without spaces | Use `reservation_orchestration_events.external_reservation_id` when present |
| `hospedagem.checkin_data` | Yes (check-in lifecycle) | `bookings.check_in` | Convert to API date format required by FNRH | Block stage transition if invalid |
| `hospedagem.checkout_data` | Yes (checkout lifecycle) | `bookings.check_out` | Convert to API date format required by FNRH | Block if check-out < check-in |
| `hospede.nome_completo` | Yes | `pre_checkin_submissions.payload.full_name` or `booking_guests.full_name` | Trim, collapse double spaces, uppercase-preserving policy | If absent, compose from `guests.first_name + last_name`; otherwise block |
| `hospede.documento.tipo` | Yes for legal identity | Derived from document length/pattern | Classify (`CPF`, `PASSAPORTE`, etc.) based on regex/rules | Use explicit manual override in compliance workflow |
| `hospede.documento.numero` | Yes | `pre_checkin_submissions.payload.document` or `booking_guests.document` or `guests.document` | Strip punctuation for canonical storage; keep presentation masked | If absent, allow only if FNRH officially permits alt doc for case; else block |
| `hospede.data_nascimento` | Usually required | `pre_checkin_submissions.payload.birthdate` or `guests.birthdate` | Convert to `YYYY-MM-DD`; validate realistic range | Mark as mandatory missing and route to manual completion |
| `hospede.email` | Optional/conditional | `bookings.guest_email` or `pre_checkin_submissions.payload.email` or `guests.email` | Lowercase, trim, basic RFC format validation | Null if absent |
| `hospede.telefone` | Optional/conditional | `bookings.guest_phone` or `pre_checkin_submissions.payload.phone` or `guests.phone` | E.164 normalization with BR defaults where possible | Null if invalid and not mandatory |
| `hospede.nacionalidade` | Conditional (foreign guest rules) | Not consistently present in current baseline | Future field required in guest profile extension | Route to manual completion queue |
| `hospede.endereco` fields | Conditional | Not consistently present in baseline | Map only when source fields exist | Null + manual completion if mandatory for scenario |
| `propriedade.nome` | Optional for payload/audit | `properties.name` | Trim + canonical utf-8 | Use property id label if missing |
| `propriedade.endereco/cidade/uf/pais/cep` | Conditional | `properties.address/city/state/country/postal_code` | Normalize accents, state as `UF` uppercase | Route to property compliance config review if missing |
| `integracao.correlation_id` | Internal required | Integration command/event context | Preserve unchanged for observability (not always sent externally) | Generate deterministic id if absent |
| `integracao.idempotency_key` | Internal required | Derived from stage + booking + tenant + guest doc hash | SHA-256 hash recommended | Send to queue metadata even if FNRH API lacks explicit field |

## Required vs optional summary

Hard-required for automated submission:
- Property FNRH credential/config binding
- Reservation identifier
- Check-in/out dates by lifecycle
- Guest full name
- Legal identity document type/number

Conditionally required:
- Birthdate, nationality, address block (depends on final FNRH schema and guest type)

Optional but recommended:
- Email
- Phone
- Non-blocking property descriptor fields in payload

## Mapping gaps identified in current Host Connect baseline

- Nationality and detailed civil-identification fields are not reliably present in existing guest capture baseline.
- Structured government-specific document taxonomy is not yet modeled centrally.
- Property compliance metadata (Cadastur/FNRH profile) requires dedicated configuration source.

## Recommended next step after SP49

Create an internal canonical `FnrhGuestEnvelope` contract and validate against latest official schema annex before SP50 implementation.
