import { AlertEvaluationService } from "@/modules/alerts/AlertEvaluationService";
import type { AlertEvaluationInput } from "@/modules/alerts/AlertRuleTypes";
import { RecommendationEngine } from "./RecommendationEngine";
import type {
  RecommendationFeatureFlags,
  RecommendationInput,
  RecommendationResult,
} from "./RecommendationTypes";

const isRecommendationEngineEnabled = (
  input: { tenant: RecommendationInput["tenant"]; featureFlags?: RecommendationFeatureFlags },
): boolean => {
  const flag = input.featureFlags?.recommendationEngine;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== input.tenant.orgId) return false;
  if (
    flag.propertyId !== undefined
    && (flag.propertyId ?? null) !== (input.tenant.propertyId ?? null)
  ) {
    return false;
  }

  return true;
};

export class RecommendationService {
  private readonly alertService: AlertEvaluationService;
  private readonly engine: RecommendationEngine;

  constructor(
    alertService = new AlertEvaluationService(),
    engine = new RecommendationEngine(),
  ) {
    this.alertService = alertService;
    this.engine = engine;
  }

  async generateFromSignals(input: RecommendationInput): Promise<RecommendationResult> {
    if (!isRecommendationEngineEnabled(input)) {
      return {
        tenant: input.tenant,
        generatedAt: new Date().toISOString(),
        recommendations: [],
      };
    }

    return this.engine.generate(input);
  }

  async evaluateAndGenerate(
    input: Omit<RecommendationInput, "alertSignals"> & {
      alertInput?: Omit<AlertEvaluationInput, "tenant" | "correlationId" | "featureFlags">;
    },
  ): Promise<RecommendationResult> {
    if (!isRecommendationEngineEnabled(input)) {
      return {
        tenant: input.tenant,
        generatedAt: new Date().toISOString(),
        recommendations: [],
      };
    }

    const alertResult = await this.alertService.evaluate({
      tenant: input.tenant,
      correlationId: input.correlationId,
      featureFlags: {
        alertEngine: {
          enabled: true,
          orgId: input.tenant.orgId,
          propertyId: input.tenant.propertyId,
        },
      },
      thresholds: input.alertInput?.thresholds,
    });

    return this.engine.generate({
      tenant: input.tenant,
      correlationId: input.correlationId,
      featureFlags: input.featureFlags,
      alertSignals: alertResult.alerts,
    });
  }
}
