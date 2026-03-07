import { Navigate } from "react-router-dom";
import { AccessPolicyEngine, useAccessContext } from "@/platform/access";
import { useTenantContext } from "@/platform/tenant";

interface TenantRouteProps {
  children: React.ReactNode;
  requireProperty?: boolean;
  fallbackPath?: string;
}

const TenantRoute = ({
  children,
  requireProperty = false,
  fallbackPath = "/dashboard",
}: TenantRouteProps) => {
  const { accessContext, isLoading } = useAccessContext();
  const { currentOrgId, currentPropertyId } = useTenantContext();

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

  const tenantDecision = AccessPolicyEngine.canAccessTenant(accessContext, currentOrgId);
  if (!tenantDecision.allowed) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requireProperty) {
    const propertyDecision = AccessPolicyEngine.canAccessProperty(
      accessContext,
      currentOrgId,
      currentPropertyId,
    );

    if (!propertyDecision.allowed) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

export default TenantRoute;
