import type { AlertSignal } from "@/modules/alerts/AlertRuleTypes";
import type {
  RecommendationInput,
  RecommendationResult,
  RecommendationSignal,
  RecommendationType,
} from "./RecommendationTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const createRecommendation = (
  input: RecommendationInput,
  type: RecommendationType,
  title: string,
  description: string,
  priority: RecommendationSignal["priority"],
  sourceAlert?: AlertSignal,
): RecommendationSignal => ({
  recommendationId: `reco-${createSeed()}`,
  type,
  priority,
  orgId: input.tenant.orgId,
  propertyId: input.tenant.propertyId,
  correlationId: input.correlationId ?? `corr-${createSeed()}`,
  title,
  description,
  sourceAlertType: sourceAlert?.type,
  createdAt: new Date().toISOString(),
  metadata: sourceAlert?.metadata,
});

export class RecommendationEngine {
  generate(input: RecommendationInput): RecommendationResult {
    const recommendations: RecommendationSignal[] = [];

    for (const alert of input.alertSignals) {
      if (alert.type === "campaign_conversion_drop") {
        recommendations.push(
          createRecommendation(
            input,
            "adjust_campaign_budget",
            "Adjust campaign budget allocation",
            "Review budget distribution for underperforming campaigns and prioritize higher-converting sources.",
            "high",
            alert,
          ),
        );
      }

      if (alert.type === "funnel_drop") {
        recommendations.push(
          createRecommendation(
            input,
            "investigate_funnel_drop",
            "Investigate funnel conversion drop",
            "Inspect lead qualification and reservation handoff points to identify conversion leakage.",
            "high",
            alert,
          ),
        );
      }

      if (alert.type === "revenue_anomaly") {
        recommendations.push(
          createRecommendation(
            input,
            "review_pricing",
            "Review pricing strategy",
            "Validate pricing competitiveness and promotional calendar against recent revenue behavior.",
            "medium",
            alert,
          ),
        );
      }

      if (alert.type === "occupancy_drop_placeholder") {
        recommendations.push(
          createRecommendation(
            input,
            "monitor_occupancy_trend",
            "Monitor occupancy trend",
            "Track occupancy movement for the next periods and evaluate tactical demand actions.",
            "low",
            alert,
          ),
        );
      }
    }

    return {
      tenant: input.tenant,
      generatedAt: new Date().toISOString(),
      recommendations,
    };
  }
}
