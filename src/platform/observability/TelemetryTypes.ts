import type { IntegrationEvent } from "@/integrations/hub";

export const TELEMETRY_EVENT_TYPE = "platform.observability.telemetry.capture.requested";

export type TelemetrySeverity = "debug" | "info" | "warn" | "error" | "critical";

export interface TelemetryTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface TelemetryFeatureFlags {
  advancedObservability?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface TelemetryCaptureCommand {
  tenant: TelemetryTenantContext;
  correlationId?: string;
  eventType: string;
  severity: TelemetrySeverity;
  message: string;
  module: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  featureFlags?: TelemetryFeatureFlags;
}

export interface TelemetryPayload {
  eventType: string;
  severity: TelemetrySeverity;
  message: string;
  module: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type TelemetryEvent = IntegrationEvent<TelemetryPayload>;

export interface TelemetryRecord {
  recordId: string;
  orgId: string;
  propertyId?: string | null;
  correlationId: string;
  eventType: string;
  severity: TelemetrySeverity;
  module: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface TelemetryCaptureResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface TelemetryQuery {
  tenant: TelemetryTenantContext;
  module?: string;
  severity?: TelemetrySeverity;
}

export interface TelemetrySnapshot {
  tenant: TelemetryTenantContext;
  records: TelemetryRecord[];
  generatedAt: string;
}
