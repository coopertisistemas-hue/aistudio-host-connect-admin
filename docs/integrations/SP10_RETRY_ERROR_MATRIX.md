# SP10 Retry/Error Matrix

## Scope
Operational matrix for OTA inventory sync retries and support triage.

| Scenario | Code | Retryable | Action |
|---|---|---|---|
| Missing OTA API key | `CONFIG_MISSING_API_KEY` | No | Configure secret and rerun |
| Invalid payload | `VALIDATION_FAILED` | No | Fix payload and rerun |
| Temporary OTA timeout | `OTA_TIMEOUT` | Yes | Auto retry up to `max_attempts` |
| OTA rate limit | `OTA_429` | Yes | Retry with backoff; monitor trends |
| OTA server error | `OTA_5XX` | Yes | Retry and escalate if persistent |

## Frontline Triage
1. Check `trace_id` and failing OTA rows.
2. Validate tenant scope (`property_id`) and payload.
3. For retryable failures, rerun with `max_attempts=3`.
4. If still failing, escalate with `trace_id`, code, attempts and timestamp.
