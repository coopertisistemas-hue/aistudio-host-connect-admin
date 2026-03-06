import type { IntegrationEvent } from "../hub";

export const CAMPAIGN_ANALYTICS_EVENT_TYPE = "marketing.campaign.analytics.requested";

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface CampaignAnalyticsCommand {
  tenant: {
    orgId: string;
    propertyId?: string | null;
  };
  correlationId?: string;
  channel: "email" | "whatsapp";
  campaignName: string;
  metrics: CampaignMetrics;
  capturedAt?: string;
  featureFlags?: {
    campaignAnalytics?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface CampaignAnalyticsPayload {
  channel: "email" | "whatsapp";
  campaignName: string;
  metrics: CampaignMetrics;
  capturedAt: string;
}

export type CampaignAnalyticsEvent = IntegrationEvent<CampaignAnalyticsPayload>;

export interface CampaignAnalyticsResult {
  accepted: boolean;
  messageId?: string;
  correlationId: string;
  reason?: "feature_disabled" | "invalid_metrics";
}

export interface CampaignAnalyticsRecord {
  analyticsId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  channel: "email" | "whatsapp";
  campaignName: string;
  metrics: CampaignMetrics;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  capturedAt: string;
}
