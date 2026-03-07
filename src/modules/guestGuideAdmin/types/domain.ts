export interface GuestGuideTenantScope {
  propertyId: string;
  orgId: string;
}

export interface GuestGuideAdminKpiSummary {
  pageViewsToday: number;
  topPages: Array<{ page: string; views: number }>;
  ctaClicksToday: number;
  partnerViewsToday: number;
  videoPlaysToday: number;
}
