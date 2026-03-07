import type { IntegrationEvent } from "../hub";

export const REVENUE_METRICS_EVENT_TYPE =
  "analytics.revenue.metrics.ingest.requested";

export interface AnalyticsTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export type AnalyticsPeriod = "daily" | "weekly" | "monthly" | "custom";

export interface RevenueByPropertyInput {
  propertyId: string;
  totalRevenue: number;
  totalReservations: number;
}

export interface RevenueByChannelInput {
  channel: "direct" | "ota" | "walk_in" | "corporate" | "other";
  reservationCount: number;
}

export interface RevenueMetricsInput {
  period: AnalyticsPeriod;
  periodStart: string;
  periodEnd: string;
  totalReservations: number;
  totalRevenue: number;
  adr: number;
  occupancySignal: number;
  revenueByProperty?: RevenueByPropertyInput[];
  revenueByPeriod?: {
    label: string;
    totalRevenue: number;
    totalReservations: number;
  }[];
  reservationCountByChannel?: RevenueByChannelInput[];
  metadata?: Record<string, unknown>;
}

export interface RevenueMetricsCommand {
  tenant: AnalyticsTenantContext;
  correlationId?: string;
  metrics: RevenueMetricsInput;
  featureFlags?: {
    revenueMetricsBaseline?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface RevenueMetricsPayload {
  metrics: RevenueMetricsInput;
  aggregatedAt: string;
}

export type RevenueMetricsEvent = IntegrationEvent<RevenueMetricsPayload>;

export interface RevenueMetricsIngestionResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface RevenueMetricsRecord {
  metricsRecordId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  period: AnalyticsPeriod;
  periodStart: string;
  periodEnd: string;
  totalReservations: number;
  totalRevenue: number;
  adr: number;
  occupancySignal: number;
  revenueByProperty?: RevenueByPropertyInput[];
  revenueByPeriod?: {
    label: string;
    totalRevenue: number;
    totalReservations: number;
  }[];
  reservationCountByChannel?: RevenueByChannelInput[];
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface RevenueMetricsQuery {
  tenant: AnalyticsTenantContext;
  period?: AnalyticsPeriod;
}

export interface RevenueMetricsSnapshot {
  tenant: AnalyticsTenantContext;
  records: RevenueMetricsRecord[];
  generatedAt: string;
}

export const CONVERSION_FUNNEL_EVENT_TYPE =
  "analytics.conversion.funnel.stage.upsert.requested";

export type FunnelStage = "impression" | "click" | "lead" | "reservation";

export interface ConversionFunnelStageInput {
  campaign: string;
  source: string;
  medium: string;
  clickIdentifier?: string;
  leadId?: string;
  reservationId?: string;
  stage: FunnelStage;
  occurredAt: string;
  metadata?: Record<string, unknown>;
}

export interface ConversionFunnelCommand {
  tenant: AnalyticsTenantContext;
  correlationId?: string;
  signal: ConversionFunnelStageInput;
  featureFlags?: {
    conversionFunnelBaseline?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface ConversionFunnelPayload {
  signal: ConversionFunnelStageInput;
  capturedAt: string;
}

export type ConversionFunnelEvent = IntegrationEvent<ConversionFunnelPayload>;

export interface ConversionFunnelResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_signal";
}

export interface ConversionFunnelRecord {
  funnelRecordId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  campaign: string;
  source: string;
  medium: string;
  clickIdentifier?: string;
  leadId?: string;
  reservationId?: string;
  stages: FunnelStage[];
  firstSeenAt: string;
  lastSeenAt: string;
  metadata?: Record<string, unknown>;
}

export interface ConversionFunnelQuery {
  tenant: AnalyticsTenantContext;
  campaign?: string;
  clickIdentifier?: string;
  leadId?: string;
  reservationId?: string;
}

export interface ConversionFunnelSnapshot {
  tenant: AnalyticsTenantContext;
  records: ConversionFunnelRecord[];
  generatedAt: string;
}

export const CAMPAIGN_METRICS_EVENT_TYPE =
  "analytics.campaign.metrics.derive.requested";

export interface CampaignRevenueInput {
  campaign: string;
  source: string;
  medium: string;
  reservationCount: number;
  totalRevenue: number;
  conversionRate: number;
  periodStart: string;
  periodEnd: string;
  metadata?: Record<string, unknown>;
}

export interface CampaignMetricsCommand {
  tenant: AnalyticsTenantContext;
  correlationId?: string;
  metrics: CampaignRevenueInput;
  featureFlags?: {
    campaignMetricsBaseline?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface CampaignMetricsPayload {
  metrics: CampaignRevenueInput;
  derivedAt: string;
}

export type CampaignMetricsEvent = IntegrationEvent<CampaignMetricsPayload>;

export interface CampaignMetricsResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface CampaignMetricsRecord {
  metricsRecordId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  campaign: string;
  source: string;
  medium: string;
  reservationCount: number;
  totalRevenue: number;
  conversionRate: number;
  revenuePerReservation: number;
  periodStart: string;
  periodEnd: string;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface CampaignMetricsQuery {
  tenant: AnalyticsTenantContext;
  campaign?: string;
  source?: string;
  medium?: string;
}

export interface CampaignMetricsSnapshot {
  tenant: AnalyticsTenantContext;
  records: CampaignMetricsRecord[];
  totals: {
    revenueByCampaign: Record<string, number>;
    reservationCountByCampaign: Record<string, number>;
    revenuePerSource: Record<string, number>;
    revenuePerMedium: Record<string, number>;
  };
  generatedAt: string;
}
