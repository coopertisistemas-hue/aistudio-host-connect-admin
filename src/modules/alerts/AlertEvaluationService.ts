import {
  CampaignMetricsLayer,
  ConversionFunnelLayer,
  InternalCampaignMetricsAdapter,
  InternalConversionFunnelAdapter,
  InternalRevenueMetricsAdapter,
  RevenueMetricsLayer,
} from "@/integrations/analytics";
import { AlertRulesEngine } from "./AlertRulesEngine";
import type { AlertEvaluationInput, AlertEvaluationResult } from "./AlertRuleTypes";

const isAlertEngineEnabled = (input: AlertEvaluationInput): boolean => {
  const flag = input.featureFlags?.alertEngine;
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

const revenueAdapter = new InternalRevenueMetricsAdapter();
const funnelAdapter = new InternalConversionFunnelAdapter();
const campaignAdapter = new InternalCampaignMetricsAdapter();

const { layer: revenueLayer } = RevenueMetricsLayer.bootstrap(revenueAdapter);
const { layer: funnelLayer } = ConversionFunnelLayer.bootstrap(funnelAdapter);
const { layer: campaignLayer } = CampaignMetricsLayer.bootstrap(campaignAdapter);

export class AlertEvaluationService {
  private readonly engine: AlertRulesEngine;

  constructor(engine = new AlertRulesEngine()) {
    this.engine = engine;
  }

  async evaluate(input: AlertEvaluationInput): Promise<AlertEvaluationResult> {
    if (!isAlertEngineEnabled(input)) {
      return {
        evaluatedAt: new Date().toISOString(),
        tenant: input.tenant,
        alerts: [],
      };
    }

    const [revenueSnapshot, funnelSnapshot, campaignSnapshot] = await Promise.all([
      revenueLayer.getRevenueSnapshot({ tenant: input.tenant }),
      funnelLayer.getFunnelSnapshot({ tenant: input.tenant }),
      campaignLayer.getCampaignMetricsSnapshot({ tenant: input.tenant }),
    ]);

    return this.engine.evaluate(input, revenueSnapshot, funnelSnapshot, campaignSnapshot);
  }
}
