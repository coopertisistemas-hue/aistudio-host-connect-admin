# Tenant Enforcement Model

## Org and property scoping rules

Baseline enforcement rules:

- Org-scoped queries must include `org_id = currentOrgId` where available.
- Property-scoped queries must include `property_id = currentPropertyId` when route/use-case requires property context.
- Tenant and property access checks are enforced in route guards via policy engine decisions.

## Service-layer enforcement standard

Service hooks should:

- consume tenant scope from `TenantContext` when standardized
- apply explicit tenant filters in all supported queries/mutations
- avoid broad unscoped reads even when RLS exists

## RLS boundary principle

RLS remains the backend security boundary, but not the sole boundary.

Control-plane stance:

- frontend/service-layer scoping is required as first-line guard
- policy guards + scoped queries reduce accidental cross-tenant exposure
- backend RLS remains mandatory final gate

## Support module tenant rules

Support hardening rules in runtime hooks:

- non-admin users: scoped to own `user_id`
- admin/staff views: scoped to tenant membership (`org_members`) user set
- comments require parent ticket/idea access verification before read/write
- admin support routes require policy-based support module access

## Onboarding provisioning boundary

Provisioning boundary is explicit:

- runtime hooks must not auto-create organizations
- tenant provisioning occurs only in onboarding flow
- dashboard access requires tenant readiness (`org` + `property`)

## Current standardization status

- critical routes: policy-guarded
- critical service hooks (support/marketing/billing/financial/guests/properties): hardened
- legacy hooks: mixed `useOrg`/`useSelectedProperty` patterns still present (known technical standardization debt)
