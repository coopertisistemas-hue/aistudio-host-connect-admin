import { Navigate } from "react-router-dom";
import {
  AccessPolicyEngine,
  type AccessCanonicalRole,
  useAccessContext,
} from "@/platform/access";
import { useTenantContext } from "@/platform/tenant";

interface RoleRouteProps {
  children: React.ReactNode;
  role?: AccessCanonicalRole;
  roles?: AccessCanonicalRole[];
  requireTenant?: boolean;
  fallbackPath?: string;
}

const ROLE_WEIGHT: Record<AccessCanonicalRole, number> = {
  CONNECT_SUPER_ADMIN: 4,
  CONNECT_ADMIN: 3,
  CLIENT_ADMIN: 2,
  CLIENT_STAFF: 1,
};

const normalizeRoles = (role?: AccessCanonicalRole, roles?: AccessCanonicalRole[]): AccessCanonicalRole[] => {
  if (roles && roles.length > 0) {
    return roles;
  }
  if (role) {
    return [role];
  }
  return ["CLIENT_STAFF"];
};

const canSatisfyRole = (
  currentRole: AccessCanonicalRole | null,
  requiredRoles: AccessCanonicalRole[],
): boolean => {
  if (!currentRole) return false;
  const currentWeight = ROLE_WEIGHT[currentRole];
  return requiredRoles.some((requiredRole) => currentWeight >= ROLE_WEIGHT[requiredRole]);
};

const RoleRoute = ({
  children,
  role,
  roles,
  requireTenant = false,
  fallbackPath = "/dashboard",
}: RoleRouteProps) => {
  const { accessContext, isLoading } = useAccessContext();
  const { currentOrgId } = useTenantContext();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const routeDecision = AccessPolicyEngine.canAccessRoute(accessContext, "authenticated");
  if (!routeDecision.allowed) {
    return <Navigate to="/auth" replace />;
  }

  if (requireTenant) {
    const tenantDecision = AccessPolicyEngine.canAccessTenant(accessContext, currentOrgId);
    if (!tenantDecision.allowed) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  const requiredRoles = normalizeRoles(role, roles);
  if (!canSatisfyRole(accessContext?.role ?? null, requiredRoles)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
