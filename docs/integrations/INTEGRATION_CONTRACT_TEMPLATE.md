# Integration Contract Template (CONNECT)

Standard contract for any external integration in Host Connect.

This template is mandatory for providers such as OTA, Google, Meta, WhatsApp, Email, and FNRH.

## 1. Provider Overview
- `provider_name`:
- `integration_domain`: `communication|marketing|distribution|compliance|payments|other`
- `business_purpose`:
- `owner_team`:
- `technical_owner`:
- `provider_docs_url`:
- `environments`: `sandbox|staging|production`

## 2. Auth and Security
- `auth_type`: `api_key|oauth2|jwt|mTLS|other`
- `token_lifecycle`: issue, refresh, expiry, revoke
- `secret_storage`: where secrets live (no secret values in repo)
- `webhook_signature`: algorithm + required headers
- `pii_fields`: list fields treated as PII
- `redaction_policy`: how logs mask sensitive data

## 3. Endpoints and Operations
| operation_id | method | endpoint | direction | criticality | timeout_ms |
|---|---|---|---|---|---|
| `send_message` | POST | `/messages/send` | outbound | high | 10000 |
| `delivery_status` | GET | `/messages/{id}` | outbound | medium | 10000 |
| `delivery_webhook` | POST | `/webhooks/provider` | inbound | high | 5000 |

Notes:
- `direction`: `inbound|outbound`
- `criticality`: `critical|high|medium|low`

## 4. Data Contract
### 4.1 Request Schema
Define canonical request shape (field types, required fields, enum constraints).

### 4.2 Response Schema
Define successful response shape and provider IDs that must be persisted.

### 4.3 Webhook Schema
Define event types, payload schema version, and replay behavior.

## 5. Idempotency and Ordering
- `idempotency_key_source`: request field or derived hash
- `dedupe_window`: retention period for duplicate detection
- `ordering_requirements`: per entity stream ordering rules
- `exactly_once_semantics`: business-level guarantee strategy

## 6. Retry, Backoff, and DLQ
- `retry_policy`: attempts, backoff, jitter
- `retryable_errors`: timeout, 429, 5xx, transient network
- `non_retryable_errors`: validation/auth/fatal business errors
- `dlq_route`: where exhausted events are stored
- `replay_procedure`: controlled replay steps and audit requirements

## 7. Error Taxonomy Mapping
| provider_error | internal_code | severity | action |
|---|---|---|---|
| `401` | `PROVIDER_AUTH_ERROR` | high | rotate token and retry |
| `429` | `PROVIDER_RATE_LIMIT` | medium | backoff and retry |
| `5xx` | `PROVIDER_UNAVAILABLE` | high | retry and alert |

## 8. Observability Contract
Required logs (structured):
- `timestamp`
- `provider_name`
- `operation_id`
- `request_id`
- `correlation_id`
- `tenant_scope` (`org_id` and optional `property_id`)
- `status`
- `latency_ms`
- `retry_count`

Required metrics:
- success rate
- error rate by error code
- p95/p99 latency
- queue lag
- DLQ volume

Required alerts:
- sustained error rate breach
- queue backlog breach
- DLQ spike

## 9. Tenant and RLS Rules
- All persisted integration events must include tenant scope (`org_id`; `property_id` where applicable).
- Any new table must have:
  - RLS enabled
  - explicit CRUD policies
  - coverage in tenant contract and RLS gates

## 10. Compliance and Retention
- `regulatory_scope`: LGPD, FNRH, fiscal, or other
- `data_minimization`: fields required vs optional
- `retention_policy`: raw payload retention and purge policy
- `audit_requirements`: actor, source, timestamp, outcome

## 11. Test and Gate Checklist
Mandatory tests:
- success path
- timeout
- rate limit (429)
- provider 5xx
- webhook replay
- duplicate idempotency key

Mandatory gates (when DB touched):
- migration naming gate
- RLS gate
- structural drift gate
- tenant contract gate

## 12. Rollout and Rollback
- `feature_flag_key`:
- `rollout_strategy`: internal -> pilot subset -> full pilot
- `rollback_trigger`: explicit thresholds
- `manual_fallback`: operator workflow if provider unavailable

## 13. Evidence Artifacts
For sprint delivery, include:
- integration contract file
- test evidence logs
- runbook link
- QA gate logs under `docs/qa/SPxx/`
