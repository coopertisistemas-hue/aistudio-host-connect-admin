export interface GuestGuidePageFilterForm {
  search?: string;
  locale?: string;
  status?: "draft" | "published" | "archived";
}

export interface GuestGuidePartnerFilterForm {
  search?: string;
  category?: string;
  activeOnly?: boolean;
}
