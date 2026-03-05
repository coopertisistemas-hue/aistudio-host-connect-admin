import type { IntegrationEvent } from "../hub";

export const WHATSAPP_MARKETING_EVENT_TYPE = "marketing.whatsapp.campaign.requested";

export type WhatsAppCampaignType = "broadcast" | "promotion" | "reengagement";

export interface WhatsAppCampaignAudience {
  segmentId?: string;
  recipients: string[];
}

export interface WhatsAppMarketingCampaignCommand {
  tenant: {
    orgId: string;
    propertyId?: string | null;
  };
  correlationId?: string;
  campaignType: WhatsAppCampaignType;
  campaignName: string;
  messageBody: string;
  audience: WhatsAppCampaignAudience;
  scheduleAt?: string;
  consent: {
    marketingWhatsAppAllowed: boolean;
    capturedAt: string;
    source: string;
  };
  featureFlags?: {
    whatsAppMarketing?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface WhatsAppMarketingCampaignPayload {
  campaignType: WhatsAppCampaignType;
  campaignName: string;
  messageBody: string;
  audience: WhatsAppCampaignAudience;
  scheduleAt?: string;
  consent: {
    marketingWhatsAppAllowed: boolean;
    capturedAt: string;
    source: string;
  };
}

export type WhatsAppMarketingCampaignEvent =
  IntegrationEvent<WhatsAppMarketingCampaignPayload>;

export interface WhatsAppMarketingCampaignResult {
  accepted: boolean;
  messageId?: string;
  correlationId: string;
  reason?: "feature_disabled" | "consent_missing" | "invalid_audience";
}

export interface WhatsAppCampaignDispatchRecord {
  dispatchId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  campaignType: WhatsAppCampaignType;
  campaignName: string;
  recipientsCount: number;
  scheduleAt?: string;
  processedAt: string;
}
