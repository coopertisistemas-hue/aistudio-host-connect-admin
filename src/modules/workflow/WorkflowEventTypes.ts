import type { IntegrationEvent } from "@/integrations/hub";
import type { AlertSignal } from "@/modules/alerts/AlertRuleTypes";
import type { RecommendationSignal } from "@/modules/recommendations/RecommendationTypes";

export const WORKFLOW_ALERT_SIGNAL_EVENT_TYPE = "workflow.signal.alert.upsert.requested";
export const WORKFLOW_RECOMMENDATION_SIGNAL_EVENT_TYPE =
  "workflow.signal.recommendation.upsert.requested";

export type WorkflowSignalKind = "alert" | "recommendation";

export interface WorkflowFeatureFlags {
  workflowSignals?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface WorkflowTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface WorkflowSignalRecord {
  workflowSignalId: string;
  kind: WorkflowSignalKind;
  sourceId: string;
  orgId: string;
  propertyId?: string | null;
  correlationId: string;
  title: string;
  description: string;
  severityOrPriority: string;
  status: "pending" | "acknowledged";
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowSignalPayload {
  signal: WorkflowSignalRecord;
  forwardedAt: string;
}

export type WorkflowSignalEvent = IntegrationEvent<WorkflowSignalPayload>;

export interface WorkflowSignalCommand {
  tenant: WorkflowTenantContext;
  alerts?: AlertSignal[];
  recommendations?: RecommendationSignal[];
  correlationId?: string;
  featureFlags?: WorkflowFeatureFlags;
}

export interface WorkflowSignalResult {
  accepted: boolean;
  correlationId: string;
  messageIds: string[];
  reason?: "feature_disabled";
}

export interface WorkflowSignalSnapshot {
  tenant: WorkflowTenantContext;
  records: WorkflowSignalRecord[];
  generatedAt: string;
}
