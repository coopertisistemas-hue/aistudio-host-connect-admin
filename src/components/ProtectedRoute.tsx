import { Navigate } from 'react-router-dom';
import { AccessPolicyEngine, useAccessContext } from '@/platform/access';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { accessContext, isLoading } = useAccessContext();

  // Show loader only if global loading is true
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

  const decision = AccessPolicyEngine.canAccessRoute(accessContext, 'authenticated');

  if (!decision.allowed) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
