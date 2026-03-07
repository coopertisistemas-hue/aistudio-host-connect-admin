import type { IntegrationEvent } from "@/integrations/hub";

export const AUDIT_EVENT_TYPE = "platform.audit.event.record.requested";

export interface AuditTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface OperationalAuditFeatureFlags {
  operationalAuditHardening?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface AuditActionInput {
  module: string;
  action: string;
  actorType: "system" | "user" | "service";
  actorId?: string;
  targetType: string;
  targetId: string;
  status: "success" | "failure" | "skipped";
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditCommand {
  tenant: AuditTenantContext;
  correlationId?: string;
  actions: AuditActionInput[];
  featureFlags?: OperationalAuditFeatureFlags;
}

export interface AuditPayload {
  actions: AuditActionInput[];
  capturedAt: string;
}

export type AuditEvent = IntegrationEvent<AuditPayload>;

export interface AuditRecord {
  auditId: string;
  orgId: string;
  propertyId?: string | null;
  module: string;
  action: string;
  actorType: "system" | "user" | "service";
  actorId?: string;
  targetType: string;
  targetId: string;
  status: "success" | "failure" | "skipped";
  correlationId: string;
  eventType: string;
  timestamp: string;
  traceComplete: boolean;
  advisoryOnly: true;
  metadata?: Record<string, unknown>;
}

export interface AuditResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface AuditQuery {
  tenant: AuditTenantContext;
  module?: string;
  action?: string;
}

export interface AuditSnapshot {
  tenant: AuditTenantContext;
  records: AuditRecord[];
  generatedAt: string;
}
