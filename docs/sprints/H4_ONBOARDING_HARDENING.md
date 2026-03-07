# H4 Onboarding Hardening

## Scope

Phase H4 removes tenant provisioning side effects from runtime hooks and enforces explicit onboarding provisioning + dashboard readiness gate.

Implemented sprints:

- H4.1 Remove Auto Org Creation
- H4.2 Explicit Provisioning Flow
- H4.3 Dashboard Gate

## H4.1 — Hook side-effect removal

`useOrg.ts` was hardened to be read-only.

- Removed fallback logic that called `create_organization()`.
- Hook now only resolves organization context from read paths:
  - `current_org_id` RPC
  - owner organization lookup
  - org membership lookup

Result: runtime hooks no longer provision tenants.

## H4.2 — Explicit provisioning in onboarding

`Onboarding.tsx` now performs explicit tenant provisioning when needed.

Provisioning sequence inside onboarding flow:

1. Ensure/create organization (explicit RPC call in onboarding logic only).
2. Ensure owner assignment (best-effort owner consistency check).
3. Create property records using the provisioned `org_id`.

Result: provisioning moved out of runtime context hooks into onboarding workflow.

## H4.3 — Dashboard tenant readiness gate

`/dashboard` route now enforces tenant readiness using `TenantRoute`:

- requires `org`
- requires `property`
- redirects to `/onboarding` when tenant is incomplete

Result: dashboard access blocked until tenant provisioning is complete.

## Constraints respected

- No new features introduced.
- No business module rewrites.
- Access/provisioning hardening only.
