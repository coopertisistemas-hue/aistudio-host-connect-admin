# FNRH API Discovery (SP48)

Date: 2026-03-06
Status: Discovery complete (no production integration implemented)

## Objective

Assess official FNRH/SNRHos integration feasibility for Host Connect while preserving pilot stability.

## Official Sources Reviewed

- Portaria MTur 6/2024 (FNRH digital regulation): https://www.in.gov.br/en/web/dou/-/portaria-mtur-n-6-de-30-de-julho-de-2024-575028077
- Portal SNRHos (MTur): https://sistema.fnrh.gov.br/#/home
- Módulo Meio de Hospedagem (MTur support): https://www.gov.br/turismo/pt-br/assuntos/sistema-nacional-de-registro-de-hospedes-snhrs/modulo-meio-de-hospedagem
- Manual de Integração API PMS v2.2: https://www.gov.br/turismo/pt-br/assuntos/sistema-nacional-de-registro-de-hospedes-snhrs/modulo-meio-de-hospedagem/ManualdeIntegraoAPIPMSv2.2.pdf

## 1) Government API availability

Finding:
- API exists and is publicly documented for PMS integration (manual v2.2).
- Public base URLs are documented for homologation and production.

Public base URLs (from manual):
- Homolog: `https://hmg-api.fnrh.gov.br/`
- Produção: `https://api.fnrh.gov.br/`

## 2) Authentication model

Finding:
- Documented as OAuth 2.0 with bearer token.
- Token endpoint and API key usage are explicitly documented.

Authentication endpoints/headers (manual):
- `POST /auth/token`
- Header requirement for auth route includes `x-api-key`
- API calls use `Authorization: Bearer <token>`

Operational note:
- Credentials are associated with the official FNRH/Cadastur onboarding process; integration must support secure credential rotation and per-property isolation.

## 3) Required fields (high level)

From regulatory text and manual:
- Establishment identification (Cadastur context)
- Guest identification and registration data
- Stay timeline and check-in/check-out context
- Integration identifiers (reservation/check-in references)

Detailed field mapping is documented in `FNRH_DATA_REQUIREMENTS.md`.

## 4) Payload structure

Observed API pattern (manual):
- Payload wrapper `dados_ficha` for registration submission flows
- Query-driven listing/search for pre-checkins/check-ins/checkout
- Explicit identifiers in query params for retrieval and mutation

## 5) Submission timing (check-in vs batch)

Regulatory + API finding:
- Regulation defines digital lifecycle for pre-checkin, check-in, and checkout operations.
- API endpoints exist for each lifecycle stage, which supports near-real-time orchestration.

Recommendation:
- Prefer event-driven near-real-time submission per lifecycle event.
- Support controlled batch replay only for retry/recovery scenarios.

## 6) Error handling expectations

Manual indicates structured HTTP errors including:
- 400 (validation/request format)
- 401 (auth token invalid/expired)
- 403/404 style not-found/forbidden responses depending on route behavior
- 500 (server-side failure)

Recommendation:
- Classify errors into retryable vs non-retryable.
- Route exhausted failures to DLQ with full correlation context.

## 7) Compliance logging requirements

Portaria obligations indicate:
- Integration history and log records are part of compliance control.
- Data access and retention are auditable within regulatory expectations.

Recommendation:
- Immutable integration audit logs (who/when/what/status).
- CorrelationId + FNRH payload hash + endpoint + response code retention.

## 8) LGPD / PII implications

Data involved includes highly sensitive personal records:
- Identification documents
- Contact and demographic data
- Stay records linked to identifiable individuals

Recommendation:
- Classify FNRH payload as high-sensitivity PII.
- Encrypt at rest/in transit; strict access controls; retention minimization.
- Enforce purpose limitation and auditability under LGPD.

## 9) Multi-property handling

Finding:
- Regulatory and Cadastur context is establishment-specific.
- Host Connect must isolate credentials and submission streams by tenant/property.

Recommendation:
- One credential/config profile per `orgId + propertyId` binding.
- No cross-property token reuse.

## 10) Retry / offline submission scenarios

Finding:
- Regulation references contingency operation and integration history.
- Real-world connectivity failures are expected and must be handled safely.

Recommendation:
- Queue-first submission with retry policy + DLQ.
- Idempotency key per FNRH lifecycle event.
- Offline backlog processing with ordered replay and compliance logs.

## Public endpoint inventory (discovery level)

From manual v2.2, publicly documented routes include:
- `POST /auth/token`
- `GET /hospedes/pre-checkins`
- `GET /hospedes/check-ins`
- `GET /hospedes/checkout`
- `POST /hospedagem/registrar`
- `GET /hospedagem/` (by identifier)
- `POST /hospedagem/pre-checkin/{id}`
- `POST /hospedagem/checkin/{id}`
- `POST /hospedagem/checkout/{id}`

## Discovery risks / open items

- Official field cardinality/enums must be revalidated against latest annex/manual at implementation start.
- Credential issuance flow and operational SLAs must be confirmed with MTur before production rollout.
- Legal retention windows should be validated with compliance counsel.

## Phase gate decision

SP48 can be marked PASS for discovery and architecture readiness.
No runtime integration should start before adapter contract hardening and compliance test-plan approval.
