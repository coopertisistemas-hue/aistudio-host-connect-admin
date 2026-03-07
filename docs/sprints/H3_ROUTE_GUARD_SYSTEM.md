# H3 Route Guard System

## Scope

Phase H3 replaces auth-only route protection with policy-driven route guards.

Implemented sprints:

- H3.1 Guard Components
- H3.2 Router Refactor
- H3.3 Sensitive Route Hardening

## Guard architecture

New guard components at `src/components/guards/`:

- `RoleRoute.tsx`
- `TenantRoute.tsx`
- `ModuleRoute.tsx`

All guards consume:

- `AccessContext` (`useAccessContext`)
- `TenantContext` (`useTenantContext`)
- `AccessPolicyEngine`

Guard responsibilities:

- `RoleRoute`: validates authenticated access and canonical role threshold.
- `TenantRoute`: validates authenticated access and tenant/property scope.
- `ModuleRoute`: validates authenticated access, tenant/property scope, and module-level policy access.

## Router refactor

`App.tsx` was refactored to use policy guards instead of legacy auth-only wrappers.

- Legacy pattern `<ProtectedRoute>` was replaced with policy guards.
- Route-level access is now explicit and scoped by role/module/tenant where required.

## Sensitive route hardening

Critical sections now require explicit policy guards:

- Billing (`/billing/*`, `/monetization/console`) via `ModuleRoute module="billing"`.
- Financial (`/financial`) via `ModuleRoute module="financial"`.
- Marketing (`/marketing/*`) via `ModuleRoute module="marketing"`.
- Operations (`/front-desk`, `/arrivals`, `/departures`, `/operation/*`, `/ops/*`, `/pdv`) via `ModuleRoute module="operations"`.
- Support (`/support/*`) via `ModuleRoute module="support"`.
- Analytics (`/reports`, `/executive/consolidation`) via `ModuleRoute module="reports"`.
- Admin (`/admin*`, `/admin-panel`, `/settings/permissions`) via `RoleRoute role="CLIENT_ADMIN"`.

## Compatibility notes

- No business logic changes were introduced.
- No new product features were added.
- Existing `AdminRoute` remains in place and is now composed with module guard on support admin routes.
