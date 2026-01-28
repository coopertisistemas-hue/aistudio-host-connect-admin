import { useEffect, useMemo, useState } from 'react';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import {
  getPilotOnboardingConfig,
  savePilotOnboardingConfig,
  type PilotOnboardingConfig,
} from '@/lib/pilotOnboarding';

export const usePilotOnboarding = () => {
  const { selectedPropertyId, isLoading } = useSelectedProperty();
  const [config, setConfig] = useState<PilotOnboardingConfig | null>(null);

  useEffect(() => {
    if (!selectedPropertyId) {
      setConfig(null);
      return;
    }
    setConfig(getPilotOnboardingConfig(selectedPropertyId));
  }, [selectedPropertyId]);

  const isComplete = useMemo(() => !!config?.completedAt, [config]);

  const saveConfig = (nextConfig: PilotOnboardingConfig) => {
    if (!selectedPropertyId) return;
    savePilotOnboardingConfig(selectedPropertyId, nextConfig);
    setConfig(nextConfig);
  };

  return {
    selectedPropertyId,
    config,
    isComplete,
    isLoading,
    saveConfig,
  };
};
