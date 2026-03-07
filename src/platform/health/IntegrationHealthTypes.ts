import type { IntegrationEvent } from "@/integrations/hub";

export const INTEGRATION_HEALTH_EVENT_TYPE = "platform.health.integration.evaluate.requested";

export type ModuleHealthStatus = "healthy" | "degraded" | "critical";

export interface HealthTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface IntegrationHealthFeatureFlags {
  integrationHealthMonitoring?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface IntegrationHealthInput {
  module: string;
  eventsProcessed: number;
  failedEvents: number;
  retryQueueDepth: number;
  deadLetterDepth: number;
  lastProcessedAt?: string;
}

export interface IntegrationHealthCommand {
  tenant: HealthTenantContext;
  correlationId?: string;
  inputs: IntegrationHealthInput[];
  featureFlags?: IntegrationHealthFeatureFlags;
}

export interface IntegrationHealthPayload {
  inputs: IntegrationHealthInput[];
  capturedAt: string;
}

export type IntegrationHealthEvent = IntegrationEvent<IntegrationHealthPayload>;

export interface IntegrationHealthSignal {
  signalId: string;
  orgId: string;
  propertyId?: string | null;
  module: string;
  status: ModuleHealthStatus;
  score: number;
  indicators: {
    eventsProcessed: number;
    failedEvents: number;
    retryQueueDepth: number;
    deadLetterDepth: number;
  };
  remediation: {
    automaticActionTaken: false;
    suggestion: string;
  };
  correlationId: string;
  updatedAt: string;
}

export interface IntegrationHealthResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface IntegrationHealthQuery {
  tenant: HealthTenantContext;
  module?: string;
}

export interface IntegrationHealthSnapshot {
  tenant: HealthTenantContext;
  signals: IntegrationHealthSignal[];
  generatedAt: string;
}
