import type { OutboxMessage } from "@/integrations/hub";
import type { AlertSignal } from "@/modules/alerts/AlertRuleTypes";
import type { RecommendationSignal } from "@/modules/recommendations/RecommendationTypes";
import {
  WORKFLOW_ALERT_SIGNAL_EVENT_TYPE,
  WORKFLOW_RECOMMENDATION_SIGNAL_EVENT_TYPE,
  type WorkflowSignalEvent,
  type WorkflowSignalPayload,
  type WorkflowTenantContext,
} from "./WorkflowEventTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export interface WorkflowEventAdapter {
  fromAlert(
    alert: AlertSignal,
    tenant: WorkflowTenantContext,
    correlationId: string,
  ): WorkflowSignalEvent;
  fromRecommendation(
    recommendation: RecommendationSignal,
    tenant: WorkflowTenantContext,
    correlationId: string,
  ): WorkflowSignalEvent;
}

const createSignalPayloadEvent = (
  eventType: string,
  signal: WorkflowSignalPayload["signal"],
  correlationId: string,
): WorkflowSignalEvent => ({
  id: `workflow-${createSeed()}`,
  eventType,
  domain: "other",
  orgId: signal.orgId,
  propertyId: signal.propertyId,
  correlationId,
  createdAt: new Date().toISOString(),
  payload: {
    signal,
    forwardedAt: new Date().toISOString(),
  },
});

export class InternalWorkflowEventAdapter implements WorkflowEventAdapter {
  fromAlert(
    alert: AlertSignal,
    tenant: WorkflowTenantContext,
    correlationId: string,
  ): WorkflowSignalEvent {
    return createSignalPayloadEvent(
      WORKFLOW_ALERT_SIGNAL_EVENT_TYPE,
      {
        workflowSignalId: `wf-alert-${alert.alertId}`,
        kind: "alert",
        sourceId: alert.alertId,
        orgId: tenant.orgId,
        propertyId: tenant.propertyId,
        correlationId,
        title: alert.title,
        description: alert.description,
        severityOrPriority: alert.severity,
        status: "pending",
        createdAt: alert.createdAt,
        metadata: {
          alertType: alert.type,
          metricValue: alert.metricValue,
          thresholdValue: alert.thresholdValue,
          ...alert.metadata,
        },
      },
      correlationId,
    );
  }

  fromRecommendation(
    recommendation: RecommendationSignal,
    tenant: WorkflowTenantContext,
    correlationId: string,
  ): WorkflowSignalEvent {
    return createSignalPayloadEvent(
      WORKFLOW_RECOMMENDATION_SIGNAL_EVENT_TYPE,
      {
        workflowSignalId: `wf-reco-${recommendation.recommendationId}`,
        kind: "recommendation",
        sourceId: recommendation.recommendationId,
        orgId: tenant.orgId,
        propertyId: tenant.propertyId,
        correlationId,
        title: recommendation.title,
        description: recommendation.description,
        severityOrPriority: recommendation.priority,
        status: "pending",
        createdAt: recommendation.createdAt,
        metadata: {
          recommendationType: recommendation.type,
          sourceAlertType: recommendation.sourceAlertType,
          ...recommendation.metadata,
        },
      },
      correlationId,
    );
  }
}

export const extractWorkflowSignal = (message: OutboxMessage): WorkflowSignalPayload["signal"] =>
  (message.event.payload as WorkflowSignalPayload).signal;
