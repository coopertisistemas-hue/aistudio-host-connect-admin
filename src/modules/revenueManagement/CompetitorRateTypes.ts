import type { IntegrationEvent } from "@/integrations/hub";
import type { RevenueTenantContext } from "./TariffCalendarTypes";

export const COMPETITOR_RATE_EVENT_TYPE = "revenue.competitor.rate.ingest.requested";

export interface CompetitorRateFeatureFlags {
  competitorRateMonitoring?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface CompetitorRateInput {
  competitorId: string;
  competitorName: string;
  date: string;
  rate: number;
  currency: "BRL" | "USD" | "EUR";
  source: "manual_placeholder" | "internal_feed_placeholder";
  metadata?: Record<string, unknown>;
}

export interface CompetitorRateCommand {
  tenant: RevenueTenantContext;
  correlationId?: string;
  rates: CompetitorRateInput[];
  featureFlags?: CompetitorRateFeatureFlags;
}

export interface CompetitorRatePayload {
  rates: CompetitorRateInput[];
  capturedAt: string;
}

export type CompetitorRateEvent = IntegrationEvent<CompetitorRatePayload>;

export interface CompetitorRateRecord {
  recordId: string;
  orgId: string;
  propertyId?: string | null;
  competitorId: string;
  competitorName: string;
  date: string;
  rate: number;
  currency: "BRL" | "USD" | "EUR";
  source: "manual_placeholder" | "internal_feed_placeholder";
  explainability: {
    providerMode: "adapter_placeholder_only";
    note: string;
  };
  advisoryOnly: true;
  correlationId: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface CompetitorRateResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface CompetitorRateQuery {
  tenant: RevenueTenantContext;
  date?: string;
  competitorId?: string;
}

export interface CompetitorRateSnapshot {
  tenant: RevenueTenantContext;
  records: CompetitorRateRecord[];
  generatedAt: string;
}
