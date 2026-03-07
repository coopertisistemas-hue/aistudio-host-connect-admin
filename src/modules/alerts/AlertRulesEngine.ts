import type { CampaignMetricsSnapshot, ConversionFunnelSnapshot, RevenueMetricsSnapshot } from "@/integrations/analytics";
import {
  DEFAULT_ALERT_THRESHOLDS,
  type AlertEvaluationInput,
  type AlertEvaluationResult,
  type AlertSignal,
  type AlertThresholds,
} from "./AlertRuleTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const mergeThresholds = (input?: Partial<AlertThresholds>): AlertThresholds => ({
  ...DEFAULT_ALERT_THRESHOLDS,
  ...input,
});

const asPercentageDrop = (current: number, previous: number): number => {
  if (previous <= 0) return 0;
  return ((previous - current) / previous) * 100;
};

const buildAlertSignal = (
  input: AlertEvaluationInput,
  type: AlertSignal["type"],
  severity: AlertSignal["severity"],
  title: string,
  description: string,
  metricValue: number,
  thresholdValue: number,
  metadata?: Record<string, unknown>,
): AlertSignal => ({
  alertId: `alert-${createSeed()}`,
  type,
  severity,
  orgId: input.tenant.orgId,
  propertyId: input.tenant.propertyId,
  correlationId: input.correlationId ?? `corr-${createSeed()}`,
  title,
  description,
  metricValue,
  thresholdValue,
  createdAt: new Date().toISOString(),
  metadata,
});

export class AlertRulesEngine {
  evaluate(
    input: AlertEvaluationInput,
    revenueSnapshot: RevenueMetricsSnapshot,
    funnelSnapshot: ConversionFunnelSnapshot,
    campaignSnapshot: CampaignMetricsSnapshot,
  ): AlertEvaluationResult {
    const thresholds = mergeThresholds(input.thresholds);
    const alerts: AlertSignal[] = [];

    const revenueRecords = revenueSnapshot.records;
    if (revenueRecords.length >= 2) {
      const current = revenueRecords[0].totalRevenue;
      const previous = revenueRecords[1].totalRevenue;
      const drop = asPercentageDrop(current, previous);

      if (drop >= thresholds.revenueDropPercentage) {
        alerts.push(
          buildAlertSignal(
            input,
            "revenue_anomaly",
            "critical",
            "Revenue anomaly detected",
            "Revenue dropped beyond configured threshold compared to previous period.",
            drop,
            thresholds.revenueDropPercentage,
            {
              currentRevenue: current,
              previousRevenue: previous,
            },
          ),
        );
      }
    }

    const stageCounts = {
      click: funnelSnapshot.records.filter((record) => record.stages.includes("click")).length,
      reservation: funnelSnapshot.records.filter((record) => record.stages.includes("reservation")).length,
      lead: funnelSnapshot.records.filter((record) => record.stages.includes("lead")).length,
    };

    const funnelConversionRate =
      stageCounts.click > 0 ? (stageCounts.reservation / stageCounts.click) * 100 : 0;
    const funnelLeadRate = stageCounts.click > 0 ? (stageCounts.lead / stageCounts.click) * 100 : 0;

    const funnelDrop = Math.max(0, funnelLeadRate - funnelConversionRate);
    if (funnelDrop >= thresholds.funnelDropPercentage) {
      alerts.push(
        buildAlertSignal(
          input,
          "funnel_drop",
          "warn",
          "Funnel drop detected",
          "Reservation conversion dropped against lead progression baseline.",
          funnelDrop,
          thresholds.funnelDropPercentage,
          {
            funnelConversionRate,
            funnelLeadRate,
          },
        ),
      );
    }

    const conversionRates = campaignSnapshot.records.map((record) => record.conversionRate);
    const averageConversionRate =
      conversionRates.length > 0
        ? conversionRates.reduce((sum, rate) => sum + rate, 0) / conversionRates.length
        : 0;

    const minConversionRate = conversionRates.length > 0 ? Math.min(...conversionRates) : 0;
    const conversionDrop = Math.max(0, averageConversionRate - minConversionRate);

    if (conversionDrop >= thresholds.campaignConversionDropPercentage) {
      alerts.push(
        buildAlertSignal(
          input,
          "campaign_conversion_drop",
          "warn",
          "Campaign conversion drop detected",
          "At least one campaign conversion rate is significantly below campaign average.",
          conversionDrop,
          thresholds.campaignConversionDropPercentage,
          {
            averageConversionRate,
            minConversionRate,
          },
        ),
      );
    }

    const occupancySignal = revenueRecords[0]?.occupancySignal ?? 100;
    if (occupancySignal < thresholds.occupancyDropThreshold) {
      alerts.push(
        buildAlertSignal(
          input,
          "occupancy_drop_placeholder",
          "info",
          "Occupancy drop placeholder",
          "Occupancy signal is below configured placeholder threshold.",
          occupancySignal,
          thresholds.occupancyDropThreshold,
        ),
      );
    }

    return {
      evaluatedAt: new Date().toISOString(),
      tenant: input.tenant,
      alerts,
    };
  }
}
