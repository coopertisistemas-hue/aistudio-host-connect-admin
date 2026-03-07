import type { AuditActionInput, AuditRecord } from "./AuditEventTypes";

export class AuditAdapter {
  normalize(input: {
    orgId: string;
    propertyId?: string | null;
    correlationId: string;
    action: AuditActionInput;
  }): Omit<AuditRecord, "auditId"> {
    const timestamp = input.action.timestamp ?? new Date().toISOString();

    const traceComplete = Boolean(
      input.orgId
      && input.correlationId
      && input.action.module
      && input.action.action
      && input.action.targetType
      && input.action.targetId,
    );

    return {
      orgId: input.orgId,
      propertyId: input.propertyId,
      module: input.action.module,
      action: input.action.action,
      actorType: input.action.actorType,
      actorId: input.action.actorId,
      targetType: input.action.targetType,
      targetId: input.action.targetId,
      status: input.action.status,
      correlationId: input.correlationId,
      eventType: "audit.normalized",
      timestamp,
      traceComplete,
      advisoryOnly: true,
      metadata: input.action.metadata,
    };
  }
}
