import type { IntegrationEvent } from "../hub";

export const GOOGLE_ADS_BASELINE_EVENT_TYPE =
  "paid_traffic.google_ads.campaign.upsert.requested";

export interface PaidTrafficTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export type GoogleAdsCampaignObjective =
  | "bookings"
  | "lead_generation"
  | "website_traffic"
  | "awareness";

export interface GoogleAdsGeoTargetingInput {
  countryCode: string;
  regionCode?: string;
  city?: string;
}

export interface GoogleAdsCampaignInput {
  campaignId: string;
  campaignName: string;
  accountId: string;
  objective: GoogleAdsCampaignObjective;
  dailyBudgetMicros: number;
  currencyCode: string;
  status: "draft" | "paused" | "active";
  startDate: string;
  endDate?: string;
  geoTargeting?: GoogleAdsGeoTargetingInput[];
  labels?: string[];
  metadata?: Record<string, unknown>;
}

export interface GoogleAdsBaselineCommand {
  tenant: PaidTrafficTenantContext;
  correlationId?: string;
  campaign: GoogleAdsCampaignInput;
  featureFlags?: {
    googleAdsBaseline?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface GoogleAdsBaselinePayload {
  campaign: GoogleAdsCampaignInput;
  requestedAt: string;
}

export type GoogleAdsBaselineEvent = IntegrationEvent<GoogleAdsBaselinePayload>;

export interface GoogleAdsBaselineResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface GoogleAdsCampaignBaselineRecord {
  syncId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  campaignId: string;
  campaignName: string;
  accountId: string;
  objective: GoogleAdsCampaignObjective;
  dailyBudgetMicros: number;
  currencyCode: string;
  status: "draft" | "paused" | "active";
  startDate: string;
  endDate?: string;
  geoTargeting?: GoogleAdsGeoTargetingInput[];
  labels?: string[];
  metadata?: Record<string, unknown>;
  syncedAt: string;
}

export interface GoogleAdsBaselineQuery {
  tenant: PaidTrafficTenantContext;
  accountId?: string;
}

export interface GoogleAdsBaselineSnapshot {
  tenant: PaidTrafficTenantContext;
  records: GoogleAdsCampaignBaselineRecord[];
  generatedAt: string;
}
