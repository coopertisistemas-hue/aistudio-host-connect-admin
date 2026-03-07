import type { IntegrationEvent } from "@/integrations/hub";
import type { GuestIntelligenceTenantContext } from "./GuestProfileTypes";

export const GUEST_LOYALTY_SIGNAL_EVENT_TYPE =
  "guest-intelligence.loyalty.evaluate.requested";

export interface GuestLoyaltyFeatureFlags {
  guestLoyaltySignals?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface GuestLoyaltyCommand {
  tenant: GuestIntelligenceTenantContext;
  correlationId?: string;
  canonicalGuestId?: string;
  featureFlags?: GuestLoyaltyFeatureFlags;
}

export interface GuestLoyaltyPayload {
  canonicalGuestId?: string;
  evaluatedAt: string;
}

export type GuestLoyaltyEvent = IntegrationEvent<GuestLoyaltyPayload>;

export interface GuestLoyaltySignal {
  canonicalGuestId: string;
  orgId: string;
  propertyId?: string | null;
  repeatGuest: boolean;
  stayFrequencyPerYear: number;
  ltvPlaceholder: number;
  preferences: {
    preferredLanguage?: "pt" | "en" | "es";
    preferredPropertyId?: string | null;
    tags: string[];
  };
  recommendationCompatibility: {
    nextBestActionHints: string[];
  };
  lifecycleCompatibility: {
    lifecycleTags: string[];
  };
  correlationId: string;
  updatedAt: string;
}

export interface GuestLoyaltyResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled";
}

export interface GuestLoyaltySnapshot {
  tenant: GuestIntelligenceTenantContext;
  signals: GuestLoyaltySignal[];
  generatedAt: string;
}
