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
