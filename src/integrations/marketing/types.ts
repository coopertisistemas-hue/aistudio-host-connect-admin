import type { IntegrationEvent } from "../hub";

export const EMAIL_MARKETING_EVENT_TYPE = "marketing.email.campaign.requested";

export type MarketingCampaignType = "newsletter" | "promotion" | "retention";

export interface MarketingTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface EmailCampaignAudience {
  segmentId?: string;
  recipients: string[];
}

export interface EmailMarketingCampaignCommand {
  tenant: MarketingTenantContext;
  correlationId?: string;
  campaignType: MarketingCampaignType;
  campaignName: string;
  subject: string;
  body: string;
  audience: EmailCampaignAudience;
  scheduleAt?: string;
  consent: {
    marketingEmailAllowed: boolean;
    capturedAt: string;
    source: string;
  };
  featureFlags?: {
    emailMarketing?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface EmailMarketingCampaignPayload {
  campaignType: MarketingCampaignType;
  campaignName: string;
  subject: string;
  body: string;
  audience: EmailCampaignAudience;
  scheduleAt?: string;
  consent: {
    marketingEmailAllowed: boolean;
    capturedAt: string;
    source: string;
  };
}

export type EmailMarketingCampaignEvent =
  IntegrationEvent<EmailMarketingCampaignPayload>;

export interface EmailMarketingCampaignResult {
  accepted: boolean;
  messageId?: string;
  correlationId: string;
  reason?: "feature_disabled" | "consent_missing" | "invalid_audience";
}

export interface MarketingDispatchRecord {
  dispatchId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  campaignType: MarketingCampaignType;
  campaignName: string;
  recipientsCount: number;
  scheduleAt?: string;
  processedAt: string;
}
