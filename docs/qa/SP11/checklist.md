# SP11 Checklist (Phase 4)

- [x] Public API v1 contract documented (`docs/integrations/SP11_PUBLIC_API_V1_SPEC.md`)
- [x] AuthN/AuthZ + scope/rate-limit rules documented (`docs/integrations/SP11_PUBLIC_API_AUTHZ_RULES.md`)
- [x] Edge shared hardening helper implemented (`supabase/functions/_shared/publicApi.ts`)
- [x] `check-availability` hardened (scope, rate limit, contract, audit)
- [x] `calculate-price` hardened (scope, rate limit, contract, audit)
- [x] `get-public-website-settings` hardened (scope, allowlist, rate limit, contract, audit)
- [x] Booking/public hooks updated for required headers + envelope parsing
- [x] Build PASS (`build.log`)
- [x] Typecheck PASS (`typecheck.log`)
- [x] Lint changed files PASS (`lint_changed_files.log`)
- [x] SP11 report completed (`SP11_REPORT.md`)
- [x] Sync-to-git
