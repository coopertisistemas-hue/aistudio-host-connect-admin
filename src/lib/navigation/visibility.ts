import { LucideIcon } from 'lucide-react';

export type OperationMode = 'simple' | 'standard' | 'hotel' | null | undefined;

export type NormalizedOperationMode = 'simplified' | 'standard' | 'full';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles?: string[];
  modes?: string[];
  gated?: boolean;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  modes?: string[];
  items: NavItem[];
}

const SIMPLIFIED_ALLOWED_URLS = new Set([
  '/dashboard',
  '/front-desk',
  '/bookings',
  '/arrivals',
  '/departures',
  '/guests',
  '/financial',
  '/settings',
  '/operation/rooms',
]);

export const normalizeOperationMode = (mode: OperationMode): NormalizedOperationMode => {
  if (mode === 'hotel') return 'full';
  if (mode === 'simple') return 'simplified';
  return 'standard';
};

const isRoleAllowed = (role: string | null | undefined, roles?: string[]) => {
  if (!roles || roles.length === 0) return true;
  return !!role && roles.includes(role);
};

const isModeAllowed = (mode: NormalizedOperationMode, itemModes?: string[]) => {
  if (!itemModes || itemModes.length === 0) return true;
  if (mode === 'full') return itemModes.includes('standard') || itemModes.includes('hotel');
  return itemModes.includes('standard');
};

const isSimplifiedItem = (item: NavItem) => SIMPLIFIED_ALLOWED_URLS.has(item.url);

export const getVisibleNavSections = (
  role: string | null | undefined,
  operationMode: OperationMode,
  groups: NavGroup[]
) => {
  const normalizedMode = normalizeOperationMode(operationMode);

  return groups
    .map((group) => {
      if (group.modes && !isModeAllowed(normalizedMode, group.modes)) {
        return null;
      }

      const items = group.items.filter((item) => {
        if (!isRoleAllowed(role, item.roles)) return false;
        if (!isModeAllowed(normalizedMode, item.modes)) return false;
        if (normalizedMode === 'simplified' && !isSimplifiedItem(item)) return false;
        return true;
      });

      if (items.length === 0) return null;
      return { ...group, items };
    })
    .filter((group): group is NavGroup => !!group);
};
