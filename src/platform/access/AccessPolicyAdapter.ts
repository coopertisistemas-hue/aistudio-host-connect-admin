import type {
  AccessCanonicalRole,
  AccessContext,
  AccessEntitlements,
  AccessPermission,
} from "./AccessPolicyTypes";

export interface AccessPolicySource {
  userId: string | null;
  orgId: string | null;
  propertyId: string | null;
  authRole: string | null;
  isSuperAdmin: boolean;
  isConnectStaff: boolean;
  plan: string | null;
  permissions: AccessPermission[];
  entitlements?: AccessEntitlements;
}

const normalizeRole = (
  authRole: string | null,
  isSuperAdmin: boolean,
  isConnectStaff: boolean,
): AccessCanonicalRole | null => {
  if (isSuperAdmin) return "CONNECT_SUPER_ADMIN";
  if (isConnectStaff) return "CONNECT_ADMIN";

  if (authRole === "owner" || authRole === "admin") {
    return "CLIENT_ADMIN";
  }

  if (authRole === "member" || authRole === "viewer" || authRole === "user") {
    return "CLIENT_STAFF";
  }

  return null;
};

export const buildAccessContext = (source: AccessPolicySource): AccessContext => {
  const role = normalizeRole(source.authRole, source.isSuperAdmin, source.isConnectStaff);

  return {
    userId: source.userId,
    orgId: source.orgId,
    propertyId: source.propertyId,
    role,
    permissions: source.permissions,
    plan: source.plan,
    entitlements: source.entitlements ?? {},
    isAuthenticated: !!source.userId,
    isConnectStaff: source.isConnectStaff,
  };
};

export const AccessPolicyAdapter = {
  buildAccessContext,
};
