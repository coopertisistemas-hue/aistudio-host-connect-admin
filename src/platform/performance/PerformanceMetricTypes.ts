import type { IntegrationEvent } from "@/integrations/hub";

export const PERFORMANCE_METRIC_EVENT_TYPE = "platform.performance.metric.capture.requested";

export interface PerformanceTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface PerformanceFeatureFlags {
  performanceBaseline?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface PerformanceMetricInput {
  module: string;
  eventType: string;
  eventsProcessed: number;
  windowSeconds: number;
  avgProcessingLatencyMs: number;
  p95ProcessingLatencyMs: number;
  queueDepth: number;
}

export interface SyntheticLoadTestInput {
  module: string;
  targetEventsPerSecond: number;
  durationSeconds: number;
}

export interface PerformanceCommand {
  tenant: PerformanceTenantContext;
  correlationId?: string;
  metrics: PerformanceMetricInput[];
  syntheticLoadTest?: SyntheticLoadTestInput;
  featureFlags?: PerformanceFeatureFlags;
}

export interface PerformancePayload {
  metrics: PerformanceMetricInput[];
  syntheticLoadTest?: SyntheticLoadTestInput;
  capturedAt: string;
}

export type PerformanceMetricEvent = IntegrationEvent<PerformancePayload>;

export interface PerformanceMetricRecord {
  recordId: string;
  orgId: string;
  propertyId?: string | null;
  module: string;
  eventType: string;
  throughputPerSecond: number;
  avgProcessingLatencyMs: number;
  p95ProcessingLatencyMs: number;
  queueDepth: number;
  syntheticLoadBaseline?: {
    targetEventsPerSecond: number;
    durationSeconds: number;
    status: "planned" | "executed_placeholder";
  };
  advisoryOnly: true;
  correlationId: string;
  updatedAt: string;
}

export interface PerformanceResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface PerformanceQuery {
  tenant: PerformanceTenantContext;
  module?: string;
}

export interface PerformanceSnapshot {
  tenant: PerformanceTenantContext;
  records: PerformanceMetricRecord[];
  generatedAt: string;
}
