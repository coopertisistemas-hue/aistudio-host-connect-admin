/**
 * React Query keys for Guest Guide Admin query hooks.
 * Phase 0: query keys only.
 */

export const guestGuideAdminQueryKeys = {
  root: ["guest-guide-admin"] as const,
  kpiSummary: (propertyId: string) => ["guest-guide-admin", "kpi-summary", propertyId] as const,
};
