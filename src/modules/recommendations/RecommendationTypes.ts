import type { AnalyticsTenantContext } from "@/integrations/analytics";
import type { AlertSignal } from "@/modules/alerts/AlertRuleTypes";

export type RecommendationType =
  | "adjust_campaign_budget"
  | "investigate_funnel_drop"
  | "review_pricing"
  | "monitor_occupancy_trend";

export type RecommendationPriority = "low" | "medium" | "high";

export interface RecommendationFeatureFlags {
  recommendationEngine?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface RecommendationInput {
  tenant: AnalyticsTenantContext;
  correlationId?: string;
  featureFlags?: RecommendationFeatureFlags;
  alertSignals: AlertSignal[];
}

export interface RecommendationSignal {
  recommendationId: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  orgId: string;
  propertyId?: string | null;
  correlationId: string;
  title: string;
  description: string;
  sourceAlertType?: AlertSignal["type"];
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface RecommendationResult {
  tenant: AnalyticsTenantContext;
  generatedAt: string;
  recommendations: RecommendationSignal[];
}
