# H2 Tenant Service Enforcement

## Scope

Phase H2 hardens tenant enforcement at the platform and service-hook layer.

Implemented sprints:

- H2.1 Tenant Context Provider
- H2.2 Service Hook Hardening
- H2.3 Support Module Security

## Architecture explanation

A dedicated tenant module was added at `src/platform/tenant/`.

- `TenantTypes.ts` defines tenant scope contracts.
- `TenantAdapter.ts` maps `AccessContext` into tenant-safe scope.
- `TenantContext.tsx` exposes `currentOrgId` and `currentPropertyId` through a unified provider.
- `index.ts` exports the tenant module.

`TenantContextProvider` is now wired into `App.tsx` under `AccessContextProvider`.

## Tenant enforcement model

- Service hooks consume tenant scope from `useTenantContext`.
- Queries must include tenant filters where columns are available:
  - `.eq('org_id', currentOrgId)`
  - `.eq('property_id', currentPropertyId)` when applicable.
- Billing/financial hooks are property-scoped through tenant context.

## Support module security hardening

`useSupport.ts` now enforces explicit scope:

- Resolves a scoped `user_id` set from tenant context (`org_members`) for admin/staff-wide views.
- Non-admin users are scoped to their own `user_id`.
- Ticket/idea fetches and updates are constrained by scoped users.
- Comment fetch/insert paths validate parent ticket/idea access before read/write.
- Staff flag query now delegates to normalized access role state instead of broad RPC fetch usage.

## Integration points

- Access layer: `src/platform/access/AccessContext.tsx`
- Tenant layer: `src/platform/tenant/*`
- Hardened hooks:
  - `useGuests.tsx`
  - `useProperties.tsx`
  - `useMarketing.tsx`
  - `useFinancialSummary.tsx`
  - `useBillingOrchestration.tsx`
  - `useSupport.ts`

## Notes

`useFinancial.ts` and `useBilling.ts` are not present in this repository. The equivalent active hooks (`useFinancialSummary.tsx` and `useBillingOrchestration.tsx`) were hardened.
