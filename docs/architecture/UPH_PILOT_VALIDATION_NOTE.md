# UPH Pilot Validation Note

## Scope

Validation baseline for UPH pilot under hardened control-plane (H1-H5).

## Expected role behavior

- CONNECT_SUPER_ADMIN
  - Cross-tenant access for platform administration.
  - Can traverse tenant boundaries intentionally through controlled context.

- CONNECT_ADMIN
  - Platform operational/admin access with elevated support capabilities.
  - Can access support-admin flows under policy checks.

- CLIENT_ADMIN
  - Full tenant administration inside own org scope.
  - Access to admin routes guarded by role and tenant requirements.

- CLIENT_STAFF
  - Tenant-scoped operational access only.
  - Module access constrained by permissions and route guards.

## Expected tenant isolation behavior

- Runtime route entry is blocked when tenant context is missing for guarded areas.
- Service-level queries on hardened paths enforce explicit tenant and/or property scope.
- Support module paths enforce tenant/user scoping instead of broad list reads.
- RLS remains final backend isolation boundary.

## Expected onboarding readiness behavior

- Runtime hooks do not auto-provision tenant organizations.
- Provisioning occurs only within onboarding flow.
- Dashboard route requires tenant readiness (`org` + `property`) and redirects to onboarding when incomplete.

## Expected route protection behavior

- Auth-only route pattern replaced on critical routes by policy guards.
- Sensitive domains (billing, financial, marketing, operations, support, analytics, admin) are policy-guarded.
- Role and module checks are centralized through AccessPolicyEngine decisions.

## Validation conclusion

UPH pilot is ready for hardened control-plane rollout with known non-critical standardization debt documented in hardening completion report.
