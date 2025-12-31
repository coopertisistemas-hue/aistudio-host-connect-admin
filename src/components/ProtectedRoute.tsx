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
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!onboardingCompleted && !location.pathname.startsWith('/onboarding') && userRole !== 'admin') {
        // Force redirect to onboarding if not completed and not already there
        // Admin bypasses this check in case they get stuck, or we can remove the admin check later
        navigate('/onboarding');
      }
    }
  }, [user, loading, navigate, location.pathname, userRole]);

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
