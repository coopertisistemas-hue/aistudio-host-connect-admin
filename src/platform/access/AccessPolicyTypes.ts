export type AccessCanonicalRole =
  | "CONNECT_SUPER_ADMIN"
  | "CONNECT_ADMIN"
  | "CLIENT_ADMIN"
  | "CLIENT_STAFF";

export type AccessRouteKey = "authenticated" | "support_admin";

export type AccessAction = "read" | "write";

export interface AccessPermission {
  moduleKey: string;
  canRead: boolean;
  canWrite: boolean;
}

export interface AccessEntitlements {
  [key: string]: boolean | number | string | null | undefined;
}

export interface AccessContext {
  userId: string | null;
  orgId: string | null;
  propertyId: string | null;
  role: AccessCanonicalRole | null;
  permissions: AccessPermission[];
  plan: string | null;
  entitlements: AccessEntitlements;
  isAuthenticated: boolean;
  isConnectStaff: boolean;
}

export interface AccessPolicyDecision {
  allowed: boolean;
  reason: string;
}
