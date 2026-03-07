export interface TenantScope {
  currentOrgId: string | null;
  currentPropertyId: string | null;
}

export interface TenantContextValue extends TenantScope {
  isLoading: boolean;
  hasTenantScope: boolean;
}
