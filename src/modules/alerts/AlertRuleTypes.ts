import type { AnalyticsTenantContext } from "@/integrations/analytics";

export type AlertSeverity = "info" | "warn" | "critical";

export type AlertType =
  | "revenue_anomaly"
  | "funnel_drop"
  | "campaign_conversion_drop"
  | "occupancy_drop_placeholder";

export interface AlertThresholds {
  revenueDropPercentage: number;
  funnelDropPercentage: number;
  campaignConversionDropPercentage: number;
  occupancyDropThreshold: number;
}

export interface AlertEngineFeatureFlags {
  alertEngine?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface AlertEvaluationInput {
  tenant: AnalyticsTenantContext;
  correlationId?: string;
  featureFlags?: AlertEngineFeatureFlags;
  thresholds?: Partial<AlertThresholds>;
}

export interface AlertSignal {
  alertId: string;
  type: AlertType;
  severity: AlertSeverity;
  orgId: string;
  propertyId?: string | null;
  correlationId: string;
  title: string;
  description: string;
  metricValue: number;
  thresholdValue: number;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface AlertEvaluationResult {
  evaluatedAt: string;
  tenant: AnalyticsTenantContext;
  alerts: AlertSignal[];
}

export const DEFAULT_ALERT_THRESHOLDS: AlertThresholds = {
  revenueDropPercentage: 20,
  funnelDropPercentage: 25,
  campaignConversionDropPercentage: 15,
  occupancyDropThreshold: 40,
};
