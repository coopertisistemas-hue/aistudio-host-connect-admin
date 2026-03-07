import type { IntegrationEvent } from "@/integrations/hub";
import type { PricingRuleDefinition } from "./PricingRulesTypes";
import type { RevenueTenantContext } from "./TariffCalendarTypes";

export const DYNAMIC_PRICE_SUGGESTION_EVENT_TYPE =
  "revenue.dynamic.price.suggestion.evaluate.requested";

export interface DynamicPriceSuggestionFeatureFlags {
  dynamicPriceSuggestion?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface DynamicPriceSuggestionCommand {
  tenant: RevenueTenantContext;
  correlationId?: string;
  targetDate: string;
  context: {
    occupancySignal: number;
    leadTimeDays: number;
    dayOfWeek: string;
  };
  pricingRules: PricingRuleDefinition[];
  featureFlags?: DynamicPriceSuggestionFeatureFlags;
}

export interface DynamicPriceSuggestionPayload {
  targetDate: string;
  context: {
    occupancySignal: number;
    leadTimeDays: number;
    dayOfWeek: string;
  };
  pricingRules: PricingRuleDefinition[];
  evaluatedAt: string;
}

export type DynamicPriceSuggestionEvent = IntegrationEvent<DynamicPriceSuggestionPayload>;

export interface DynamicPriceSuggestionRecord {
  suggestionId: string;
  orgId: string;
  propertyId?: string | null;
  targetDate: string;
  baseRate: number;
  rulesSuggestedRate: number;
  competitorAverageRate?: number;
  suggestedRate: number;
  explainability: {
    method: "weighted_baseline";
    inputs: {
      baseRate: number;
      rulesSuggestedRate: number;
      competitorAverageRate?: number;
    };
    weights: {
      rulesWeight: number;
      competitorWeight: number;
      baseWeight: number;
    };
    notes: string[];
  };
  advisoryOnly: true;
  correlationId: string;
  updatedAt: string;
}

export interface DynamicPriceSuggestionResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface DynamicPriceSuggestionQuery {
  tenant: RevenueTenantContext;
  targetDate?: string;
}

export interface DynamicPriceSuggestionSnapshot {
  tenant: RevenueTenantContext;
  records: DynamicPriceSuggestionRecord[];
  generatedAt: string;
}
