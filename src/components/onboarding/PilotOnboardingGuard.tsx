import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePilotOnboarding } from '@/hooks/usePilotOnboarding';

const PILOT_ONBOARDING_ROUTE = '/pilot-onboarding';

const PilotOnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPropertyId, isComplete, isLoading } = usePilotOnboarding();

  useEffect(() => {
    if (isLoading) return;
    if (!selectedPropertyId) return;
    if (location.pathname === PILOT_ONBOARDING_ROUTE) return;
    if (!isComplete) {
      navigate(PILOT_ONBOARDING_ROUTE, { replace: true });
    }
  }, [isComplete, isLoading, location.pathname, navigate, selectedPropertyId]);

  return <>{children}</>;
};

export default PilotOnboardingGuard;
