import type { IntegrationEvent } from "@/integrations/hub";
import type { GuestIntelligenceTenantContext } from "./GuestProfileTypes";

export const GUEST_SEGMENTATION_EVENT_TYPE =
  "guest-intelligence.segmentation.evaluate.requested";

export type RecencySegment = "new" | "active" | "dormant" | "inactive";
export type FrequencySegment = "single_stay" | "occasional" | "frequent" | "champion";
export type ValueBucket = "low" | "medium" | "high" | "vip_placeholder";

export interface GuestSegmentationFeatureFlags {
  guestSegmentation?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface GuestSegmentationCommand {
  tenant: GuestIntelligenceTenantContext;
  correlationId?: string;
  canonicalGuestId?: string;
  featureFlags?: GuestSegmentationFeatureFlags;
}

export interface GuestSegmentationPayload {
  canonicalGuestId?: string;
  evaluatedAt: string;
}

export type GuestSegmentationEvent = IntegrationEvent<GuestSegmentationPayload>;

export interface GuestSegmentSignal {
  canonicalGuestId: string;
  orgId: string;
  propertyId?: string | null;
  recency: RecencySegment;
  frequency: FrequencySegment;
  valueBucket: ValueBucket;
  segmentTags: string[];
  status: "ready" | "insufficient_data";
  explainability: {
    recencyDays?: number;
    totalStays: number;
    totalRevenue: number;
    reasons: string[];
  };
  correlationId: string;
  updatedAt: string;
}

export interface GuestSegmentationResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled";
}

export interface GuestSegmentationSnapshot {
  tenant: GuestIntelligenceTenantContext;
  signals: GuestSegmentSignal[];
  generatedAt: string;
}
