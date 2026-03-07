# Authorization Model

## Canonical roles

- CONNECT_SUPER_ADMIN
- CONNECT_ADMIN
- CLIENT_ADMIN
- CLIENT_STAFF

## AccessContext structure

AccessContext is the canonical runtime authorization input:

- userId
- orgId
- propertyId
- role
- permissions
- plan
- entitlements
- isAuthenticated
- isConnectStaff

Source composition:

- auth/session/profile state
- org membership context
- selected property context
- module permissions
- staff/admin signal

## AccessPolicyEngine responsibilities

`AccessPolicyEngine` provides deterministic decision helpers:

- `canAccessRoute(context, routeKey)`
- `canAccessModule(context, moduleKey, action)`
- `canAccessTenant(context, tenantOrgId)`
- `canAccessProperty(context, tenantOrgId, tenantPropertyId)`

Behavioral principles:

- decisions rely only on `AccessContext`
- allow/deny is explicit with reason metadata
- platform-level roles can satisfy broader access scopes
- tenant/property checks are explicit for runtime gate enforcement

## Route guard responsibilities

Guard components and their responsibilities:

- `RoleRoute`
  - authenticated route check
  - role threshold enforcement
  - optional tenant requirement

- `TenantRoute`
  - authenticated route check
  - tenant check (`org`)
  - optional property check

- `ModuleRoute`
  - authenticated route check
  - tenant/property check (when required)
  - module permission decision via policy engine

## Runtime integration

- App root composes `AccessContextProvider` and `TenantContextProvider`
- Sensitive sections are protected by policy guards
- Support admin path composes `ModuleRoute` with `AdminRoute`

## Scope boundary

This model hardens control-plane access without changing business logic behavior.
