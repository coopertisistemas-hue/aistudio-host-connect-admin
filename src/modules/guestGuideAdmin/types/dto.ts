export interface GuestGuideKpiSummaryDto {
  page_views_today: number;
  top_pages: Array<{ page: string; views: number }>;
  cta_clicks_today: number;
  partner_views_today: number;
  video_plays_today: number;
}

export interface GuestGuideKpiSummaryResponseDto {
  kpi: GuestGuideKpiSummaryDto;
}
