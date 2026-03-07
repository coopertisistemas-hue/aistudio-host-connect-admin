import type { IntegrationEvent } from "@/integrations/hub";
import type { PricingRuleDefinition } from "@/modules/revenueManagement";
import type { DistributionTenantContext } from "./ChannelAbstractionTypes";

export const RATE_SYNC_EVENT_TYPE = "distribution.rate.sync.requested";

export interface RateSyncFeatureFlags {
  rateSyncBaseline?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface RateSyncInput {
  internalRatePlanId: string;
  internalRoomTypeId: string;
  date: string;
}

export interface RateSyncCommand {
  tenant: DistributionTenantContext;
  correlationId?: string;
  provider: string;
  context: {
    occupancySignal: number;
    leadTimeDays: number;
    dayOfWeek: string;
  };
  pricingRules: PricingRuleDefinition[];
  rates: RateSyncInput[];
  featureFlags?: RateSyncFeatureFlags;
}

export interface RateSyncPayload {
  provider: string;
  context: {
    occupancySignal: number;
    leadTimeDays: number;
    dayOfWeek: string;
  };
  pricingRules: PricingRuleDefinition[];
  rates: RateSyncInput[];
  capturedAt: string;
}

export type RateSyncEvent = IntegrationEvent<RateSyncPayload>;

export interface RateSyncRecord {
  syncId: string;
  orgId: string;
  propertyId?: string | null;
  provider: string;
  date: string;
  internalRoomTypeId: string;
  internalRatePlanId: string;
  mappedChannelRatePlanCode: string;
  baseRate: number;
  suggestedRate: number;
  idempotencyKey: string;
  replaySafe: true;
  advisoryOnly: true;
  correlationId: string;
  explainability: {
    source: "pricing_rules_plus_tariff";
    notes: string[];
  };
  updatedAt: string;
}

export interface RateSyncResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload" | "mapping_missing";
}

export interface RateSyncQuery {
  tenant: DistributionTenantContext;
  provider?: string;
  date?: string;
}

export interface RateSyncSnapshot {
  tenant: DistributionTenantContext;
  records: RateSyncRecord[];
  generatedAt: string;
}
