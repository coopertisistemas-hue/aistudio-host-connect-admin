export type FeatureFlag =
  | 'PREFETCH_NAV'
  | 'SAFE_OBSERVABILITY'
  | 'HK_MAINTENANCE'
  | 'HK_BULK_ACTIONS'
  | 'HK_CHECKLIST';

const isProd = import.meta.env.MODE === 'production';
const DEFAULTS: Record<FeatureFlag, boolean> = {
  PREFETCH_NAV: !isProd,
  SAFE_OBSERVABILITY: !isProd,
  HK_MAINTENANCE: !isProd,
  HK_BULK_ACTIONS: !isProd,
  HK_CHECKLIST: !isProd,
};

const listFromEnv = (value?: string) =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const FEATURE_LIST = listFromEnv(import.meta.env.VITE_FEATURE_FLAGS);

const PROPERTY_FLAGS_PREFIX = 'hc_property_flags';

const getPropertyFlagsKey = (propertyId: string) =>
  `${PROPERTY_FLAGS_PREFIX}:${propertyId}`;

const isStorageAvailable = () => typeof window !== 'undefined' && !!window.localStorage;

const safeParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getPropertyFeatureFlagOverrides = (propertyId?: string | null) => {
  if (!propertyId || !isStorageAvailable()) return null;
  return safeParse<Partial<Record<FeatureFlag, boolean>>>(
    localStorage.getItem(getPropertyFlagsKey(propertyId))
  );
};

export const setPropertyFeatureFlagOverrides = (
  propertyId: string,
  overrides: Partial<Record<FeatureFlag, boolean>>
) => {
  if (!isStorageAvailable()) return;
  localStorage.setItem(getPropertyFlagsKey(propertyId), JSON.stringify(overrides));
};

const getPropertyOverride = (flag: FeatureFlag) => {
  if (!isStorageAvailable()) return null;
  const propertyId = localStorage.getItem('selectedPropertyId');
  if (!propertyId) return null;
  const overrides = getPropertyFeatureFlagOverrides(propertyId);
  if (!overrides) return null;
  if (typeof overrides[flag] !== 'boolean') return null;
  return overrides[flag] as boolean;
};

const getExplicitFlag = (flag: FeatureFlag) => {
  const envKey = `VITE_FLAG_${flag}`;
  const value = (import.meta.env as Record<string, string | undefined>)[envKey];
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
};

export const isFeatureEnabled = (flag: FeatureFlag) => {
  const propertyOverride = getPropertyOverride(flag);
  if (propertyOverride !== null) return propertyOverride;
  const explicit = getExplicitFlag(flag);
  if (explicit !== null) return explicit;
  if (FEATURE_LIST.includes(flag)) return true;
  return DEFAULTS[flag];
};

export const enabledFeatureFlags = () =>
  (Object.keys(DEFAULTS) as FeatureFlag[]).filter(isFeatureEnabled);
