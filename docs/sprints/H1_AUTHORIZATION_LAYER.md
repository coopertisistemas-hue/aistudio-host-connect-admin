# H1 Authorization Layer

## Scope

Phase H1 hardens the access-control platform layer without introducing new business features.

Implemented sprints:

- H1.1 Access Policy Core
- H1.2 Access Context
- H1.3 Admin / Staff Integration

## Architecture explanation

A new platform module was added at `src/platform/access/`.

Core pieces:

- `AccessPolicyTypes.ts`: canonical role model and AccessContext contract.
- `AccessPolicyEngine.ts`: centralized policy decisions based only on AccessContext.
- `AccessPolicyAdapter.ts`: normalization from raw auth/permission sources into canonical AccessContext.
- `AccessContext.tsx`: unified provider that aggregates auth, org, selected property, permissions and staff RPC state.

## Policy model

Canonical roles:

- `CONNECT_SUPER_ADMIN`
- `CONNECT_ADMIN`
- `CLIENT_ADMIN`
- `CLIENT_STAFF`

Policy helpers:

- `canAccessRoute()`
- `canAccessModule()`
- `canAccessTenant()`
- `canAccessProperty()`

All helper functions consume only `AccessContext` and return structured allow/deny decisions.

## Integration points

- `ProtectedRoute` now delegates route authorization to `AccessPolicyEngine.canAccessRoute(context, "authenticated")`.
- `AdminRoute` now delegates route authorization to `AccessPolicyEngine.canAccessRoute(context, "support_admin")`.
- `is_hostconnect_staff` RPC is normalized through `AccessContextProvider` and injected into the canonical role decision path.

## Non-goals / constraints respected

- No business module behavior changes.
- No new features.
- No DB schema changes.
- No provider integrations.
- No broad route rewrites in this phase.
