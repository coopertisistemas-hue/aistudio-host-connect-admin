# SP11 Public API AuthN/AuthZ Rules

## Scope Policy
- Every public request must carry `x-api-scope`.
- Endpoint must validate exact required scope:
  - `check-availability` -> `public.booking.availability.read`
  - `calculate-price` -> `public.booking.pricing.read`
  - `get-public-website-settings` -> `public.website.settings.read`
- Missing/invalid scope returns `403 SCOPE_REQUIRED`.

## Property Boundary
- Every endpoint requires `property_id`.
- `property_id` must be a valid UUID (`400 INVALID_IDENTIFIER` when invalid).
- All reads are filtered by property scope.

## Public API Key (property-level optional hardening)
- If `website_settings.setting_key = 'public_api_key'` exists for property:
  - header `x-public-api-key` becomes mandatory.
  - mismatch returns `401 API_KEY_INVALID`.
- If key is not configured:
  - request is accepted with scope + rate limit validation only.

## Rate Limit Rule
- Request key = `endpoint + (x-client-id || x-forwarded-for || cf-connecting-ip || anonymous)`.
- Fixed window (60s), per-endpoint quotas.
- Exceeding quota returns `429 RATE_LIMITED` with `Retry-After`.

## Audit Minimum
- Log structured events for:
  - success (`public_api.success`)
  - rate-limited (`public_api.rate_limited`)
  - unhandled errors (`public_api.error`)
- Include `trace_id` in logs and responses for correlation.

## Tenant Safety Notes
- Public endpoints are property-scoped only; no org-wide listing endpoints were introduced.
- Service role is used only inside edge functions with explicit property predicates.
- Public settings endpoint restricts output to safe allowlist keys.
