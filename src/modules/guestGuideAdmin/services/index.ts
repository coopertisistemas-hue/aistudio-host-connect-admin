/**
 * Domain service boundary for Guest Guide Admin.
 * Phase 0: definitions only.
 */

export interface GuestGuideAdminServiceBoundary {
  readonly canReadDashboardKpi: boolean;
  readonly mutationMode: "blocked" | "requires_architectural_decision";
}
