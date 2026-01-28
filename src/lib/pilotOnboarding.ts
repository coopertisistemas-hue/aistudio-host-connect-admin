import type { FeatureFlag } from '@/lib/featureFlags';

export type OperationalProfile =
  | 'Operação Completa'
  | 'Operação Enxuta'
  | 'Operação Simplificada';

export type LodgingType =
  | 'Hotel'
  | 'Pousada'
  | 'Hostel'
  | 'Casa de temporada'
  | 'Chalé / Cabana'
  | 'Lodge'
  | 'Camping / Glamping'
  | 'Eco pousada / Eco village'
  | 'Hospedagem rural / Fazenda'
  | 'Loft';

export type AttributeTag =
  | 'Boutique'
  | 'Eco / Sustentável'
  | 'Rural'
  | 'Glamping'
  | 'Pet friendly'
  | 'Auto check-in'
  | 'Familiar'
  | 'Adult only';

export interface PilotOnboardingConfig {
  operationalProfile: OperationalProfile;
  lodgingType: LodgingType;
  attributes: AttributeTag[];
  completedAt: string | null;
  updatedAt: string;
}

const STORAGE_PREFIX = 'hc_pilot_onboarding';

const getStorageKey = (propertyId: string) => `${STORAGE_PREFIX}:${propertyId}`;

const isStorageAvailable = () => typeof window !== 'undefined' && !!window.localStorage;

const safeParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getPilotOnboardingConfig = (propertyId?: string | null) => {
  if (!propertyId || !isStorageAvailable()) return null;
  return safeParse<PilotOnboardingConfig>(
    localStorage.getItem(getStorageKey(propertyId))
  );
};

export const savePilotOnboardingConfig = (
  propertyId: string,
  config: PilotOnboardingConfig
) => {
  if (!isStorageAvailable()) return;
  localStorage.setItem(getStorageKey(propertyId), JSON.stringify(config));
};

export const getOperationalProfilePresets = (
  profile: OperationalProfile
): Partial<Record<FeatureFlag, boolean>> => {
  if (profile === 'Operação Completa') {
    return {
      HK_MAINTENANCE: true,
      HK_CHECKLIST: true,
      HK_BULK_ACTIONS: true,
    };
  }

  if (profile === 'Operação Enxuta') {
    return {
      HK_MAINTENANCE: true,
      HK_CHECKLIST: false,
      HK_BULK_ACTIONS: false,
    };
  }

  return {
    HK_MAINTENANCE: false,
    HK_CHECKLIST: false,
    HK_BULK_ACTIONS: false,
  };
};
