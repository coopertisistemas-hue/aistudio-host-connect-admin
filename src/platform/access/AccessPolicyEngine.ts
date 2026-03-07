import type {
  AccessAction,
  AccessContext,
  AccessPolicyDecision,
  AccessRouteKey,
} from "./AccessPolicyTypes";

const denied = (reason: string): AccessPolicyDecision => ({
  allowed: false,
  reason,
});

const allowed = (reason: string): AccessPolicyDecision => ({
  allowed: true,
  reason,
});

const hasFullPlatformAccess = (context: AccessContext | null): boolean => {
  if (!context) return false;
  return context.role === "CONNECT_SUPER_ADMIN" || context.role === "CONNECT_ADMIN";
};

const hasTenantAdminAccess = (context: AccessContext | null): boolean => {
  if (!context) return false;
  return context.role === "CLIENT_ADMIN";
};

export const canAccessRoute = (
  context: AccessContext | null,
  routeKey: AccessRouteKey,
): AccessPolicyDecision => {
  if (!context?.isAuthenticated) {
    return denied("not_authenticated");
  }

  if (routeKey === "authenticated") {
    return allowed("authenticated");
  }

  if (routeKey === "support_admin") {
    if (hasFullPlatformAccess(context) || context.isConnectStaff) {
      return allowed("staff_or_platform_admin");
    }
    return denied("missing_staff_access");
  }

  return denied("unknown_route_policy");
};

export const canAccessModule = (
  context: AccessContext | null,
  moduleKey: string,
  action: AccessAction = "read",
): AccessPolicyDecision => {
  if (!context?.isAuthenticated) {
    return denied("not_authenticated");
  }

  if (hasFullPlatformAccess(context) || hasTenantAdminAccess(context)) {
    return allowed("admin_access");
  }

  const permission = context.permissions.find((entry) => entry.moduleKey === moduleKey);
  if (!permission) {
    return denied("missing_permission");
  }

  if (action === "write" && !permission.canWrite) {
    return denied("missing_write_permission");
  }

  if (action === "read" && !permission.canRead) {
    return denied("missing_read_permission");
  }

  return allowed("module_permission_granted");
};

export const canAccessTenant = (
  context: AccessContext | null,
  tenantOrgId: string | null | undefined,
): AccessPolicyDecision => {
  if (!context?.isAuthenticated) {
    return denied("not_authenticated");
  }

  if (hasFullPlatformAccess(context)) {
    return allowed("platform_scope_access");
  }

  if (!tenantOrgId || !context.orgId) {
    return denied("missing_tenant_context");
  }

  if (context.orgId !== tenantOrgId) {
    return denied("tenant_mismatch");
  }

  return allowed("tenant_match");
};

export const canAccessProperty = (
  context: AccessContext | null,
  tenantOrgId: string | null | undefined,
  tenantPropertyId: string | null | undefined,
): AccessPolicyDecision => {
  const tenantDecision = canAccessTenant(context, tenantOrgId);
  if (!tenantDecision.allowed) {
    return tenantDecision;
  }

  if (!tenantPropertyId) {
    return allowed("no_property_scope_required");
  }

  if (hasFullPlatformAccess(context) || hasTenantAdminAccess(context)) {
    return allowed("admin_property_scope");
  }

  if (!context?.propertyId) {
    return denied("missing_property_context");
  }

  if (context.propertyId !== tenantPropertyId) {
    return denied("property_mismatch");
  }

  return allowed("property_match");
};

export const AccessPolicyEngine = {
  canAccessRoute,
  canAccessModule,
  canAccessTenant,
  canAccessProperty,
};
