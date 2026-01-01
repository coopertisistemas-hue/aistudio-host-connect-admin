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
      } else {
        // Only redirect if explicitly FALSE. If NULL (unknown), we wait.
        if (onboardingCompleted === false && !location.pathname.startsWith('/onboarding') && userRole !== 'admin') {
          console.log('[ProtectedRoute] Onboarding explicitly incomplete, redirecting to /onboarding');
          navigate('/onboarding');
        }
        // If onboardingCompleted is null, we do nothing (let it load or stay in "loading" state)
      }
    }
  }, [user, loading, navigate, location.pathname, userRole, onboardingCompleted]);

  // Show loader if global loading is true OR if we have a user but don't know their onboarding status yet
  // This prevents the "ProtectedRoute" from rendering children before we know if we should redirect.
  if (loading || (user && onboardingCompleted === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
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
