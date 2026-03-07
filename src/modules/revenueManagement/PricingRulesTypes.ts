import type { IntegrationEvent } from "@/integrations/hub";
import type { RevenueTenantContext } from "./TariffCalendarTypes";

export const PRICING_RULES_EVENT_TYPE = "revenue.pricing.rules.evaluate.requested";

export type PricingRuleCondition =
  | "occupancy_above"
  | "occupancy_below"
  | "lead_time_below_days"
  | "day_of_week_in";

export type PricingRuleActionType = "increase_percentage" | "decrease_percentage" | "set_floor_rate";

export interface PricingRuleDefinition {
  ruleId: string;
  name: string;
  priority: number;
  enabled: boolean;
  condition: {
    type: PricingRuleCondition;
    value: number | string[];
  };
  action: {
    type: PricingRuleActionType;
    value: number;
  };
}

export interface PricingRulesFeatureFlags {
  pricingRulesEngine?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface PricingRulesCommand {
  tenant: RevenueTenantContext;
  correlationId?: string;
  targetDate: string;
  baseRate: number;
  context: {
    occupancySignal: number;
    leadTimeDays: number;
    dayOfWeek: string;
  };
  rules: PricingRuleDefinition[];
  featureFlags?: PricingRulesFeatureFlags;
}

export interface PricingRulesPayload {
  targetDate: string;
  baseRate: number;
  context: {
    occupancySignal: number;
    leadTimeDays: number;
    dayOfWeek: string;
  };
  rules: PricingRuleDefinition[];
  evaluatedAt: string;
}

export type PricingRulesEvent = IntegrationEvent<PricingRulesPayload>;

export interface PricingRuleEvaluationRecord {
  evaluationId: string;
  orgId: string;
  propertyId?: string | null;
  targetDate: string;
  baseRate: number;
  suggestedRate: number;
  appliedRuleIds: string[];
  precedenceOrder: string[];
  explainability: {
    matchedRules: Array<{
      ruleId: string;
      reason: string;
      effect: string;
    }>;
  };
  advisoryOnly: true;
  correlationId: string;
  updatedAt: string;
}

export interface PricingRulesResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface PricingRulesQuery {
  tenant: RevenueTenantContext;
  targetDate?: string;
}

export interface PricingRulesSnapshot {
  tenant: RevenueTenantContext;
  records: PricingRuleEvaluationRecord[];
  generatedAt: string;
}
