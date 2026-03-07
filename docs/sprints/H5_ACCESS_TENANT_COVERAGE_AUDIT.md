# H5.1 Access and Tenant Coverage Audit

## Scope

Audit scope focused on control-plane consistency after H1-H4 hardening:

- AccessContext usage
- AccessPolicyEngine usage
- TenantContext usage
- Policy-based route guard coverage

## Coverage status by target area

### CRM / Guest Intelligence
- Status: Partial
- Notes:
  - Domain modules under `src/integrations/crm/*` and `src/modules/guestIntelligence/*` remain baseline-oriented and are not route-exposed directly.
  - Runtime hooks/pages still rely mainly on `useOrg`/`useSelectedProperty` patterns, not yet uniformly `useTenantContext`.

### Revenue Management
- Status: Baseline-only
- Notes:
  - `src/modules/revenueManagement/*` exists as internal baseline architecture.
  - No broad direct route surface to enforce beyond existing route guards.

### Distribution
- Status: Baseline-only
- Notes:
  - `src/modules/distribution/*` is internal/advisory foundation.
  - Control-plane coverage is indirect via global route and tenant hardening.

### Analytics
- Status: Partial
- Notes:
  - Integrations under `src/integrations/analytics/*` are baseline layers.
  - Route-level analytics entry points (`/reports`, `/executive/consolidation`) are now guarded by `ModuleRoute module="reports" requireProperty`.

### Alerts / Recommendations
- Status: Baseline-only
- Notes:
  - `src/modules/alerts/*` and `src/modules/recommendations/*` are internal baseline modules.

### Workflow
- Status: Baseline-only
- Notes:
  - `src/modules/workflow/*` exists and remains internal signal baseline.

### Support
- Status: Covered
- Notes:
  - Support routes are now protected by policy guards (`ModuleRoute module="support" requireTenant`).
  - Admin support routes are composed with `AdminRoute` + `ModuleRoute`.
  - Service hook `useSupport.ts` uses explicit access/tenant scoping with `useAccessContext` + `useTenantContext`.

### Marketing
- Status: Covered
- Notes:
  - Marketing routes protected by `ModuleRoute module="marketing" requireProperty`.
  - Service hook `useMarketing.tsx` hardened with tenant/property scope constraints.

### Billing
- Status: Covered
- Notes:
  - Billing routes protected by `ModuleRoute module="billing" requireProperty`.
  - Billing data hook uses tenant scope via `useTenantContext` (`useBillingOrchestration.tsx`).

### Financial
- Status: Covered
- Notes:
  - Financial route protected by `ModuleRoute module="financial" requireProperty`.
  - Financial summary path uses tenant-scoped property resolution (`useFinancialSummary.tsx`).

### Dashboard routes
- Status: Covered
- Notes:
  - Dashboard route enforces tenant readiness (`TenantRoute requireProperty fallbackPath="/onboarding"`).

### Admin routes
- Status: Covered
- Notes:
  - Admin paths (`/admin*`, `/admin-panel`, `/settings/permissions`) enforce `RoleRoute role="CLIENT_ADMIN" requireTenant`.

## Cross-module findings

### Covered
- AccessContext and AccessPolicyEngine are active in route guard components and `AdminRoute`/`ProtectedRoute` lineage.
- TenantContext is integrated into app root and consumed by hardened service hooks.
- Critical route surfaces are no longer auth-only.

### Still partial
- Many legacy hooks still depend on `useOrg` + `useSelectedProperty` directly instead of `useTenantContext`.
- This is control-plane consistent but not yet fully standardized across all hooks.

### Intentionally baseline-only
- Internal modules from phases 19-25 (analytics/revenue/distribution/alerts/recommendations/workflow/guest-intelligence extensions) remain baseline foundations and are not full production control surfaces yet.

## Audit conclusion

Control-plane hardening is materially improved and active on critical runtime surfaces. Remaining work is mostly standardization debt (hook-level tenant source unification) and expected baseline-only module maturity from earlier phased execution.
