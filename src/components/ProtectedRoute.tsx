import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, userRole, onboardingCompleted } = useAuth();
  const navigate = useNavigate(); // Restore navigate
  const location = useLocation();

  useEffect(() => {
    // DEBUG LOGGING
    console.log('[ProtectedRoute] Check:', {
      loading,
      hasUser: !!user,
      onboardingCompleted,
      path: location.pathname,
      role: userRole
    });

    if (!loading) {
      if (!user) {
        console.log('[ProtectedRoute] No user, redirecting to /auth');
        navigate('/auth');
      } else if (!onboardingCompleted && !location.pathname.startsWith('/onboarding') && userRole !== 'admin') {
        console.log('[ProtectedRoute] Onboarding incomplete, redirecting to /onboarding');
        navigate('/onboarding');
      }
    }
  }, [user, loading, navigate, location.pathname, userRole, onboardingCompleted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
