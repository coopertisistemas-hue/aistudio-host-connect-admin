import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import { AuditAdapter } from "./AuditAdapter";
import {
  AUDIT_EVENT_TYPE,
  type AuditCommand,
  type AuditEvent,
  type AuditPayload,
  type AuditQuery,
  type AuditRecord,
  type AuditResult,
  type AuditSnapshot,
} from "./AuditEventTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isFeatureEnabled = (command: AuditCommand): boolean => {
  const flag = command.featureFlags?.operationalAuditHardening;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (flag.propertyId !== undefined && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)) {
    return false;
  }
  return true;
};

const isValidPayload = (command: AuditCommand): boolean => {
  if (command.actions.length === 0) return false;
  return command.actions.every((action) =>
    !!action.module.trim()
    && !!action.action.trim()
    && !!action.targetType.trim()
    && !!action.targetId.trim(),
  );
};

const key = (orgId: string, propertyId: string | null | undefined, module: string, action: string, targetId: string, correlationId: string) =>
  `${orgId}:${propertyId ?? "__all"}:${module}:${action}:${targetId}:${correlationId}`;

export class AuditLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: AuditAdapter;
  private readonly records = new Map<string, AuditRecord>();

  constructor(eventBus: EventBus, outboxQueue: OutboxQueue, adapter = new AuditAdapter()) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: AUDIT_EVENT_TYPE,
      handle: async (event) => {
        const payload = event.payload as AuditPayload;
        for (const action of payload.actions) {
          const normalized = this.adapter.normalize({
            orgId: event.orgId,
            propertyId: event.propertyId,
            correlationId: event.correlationId,
            action,
          });

          const record: AuditRecord = {
            auditId: `audit-${createSeed()}`,
            ...normalized,
          };

          this.records.set(
            key(
              event.orgId,
              event.propertyId,
              action.module,
              action.action,
              action.targetId,
              event.correlationId,
            ),
            record,
          );
        }
      },
    });
  }

  static bootstrap(adapter?: AuditAdapter): {
    layer: AuditLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new AuditLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async record(command: AuditCommand): Promise<AuditResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;

    if (!isFeatureEnabled(command)) {
      return { accepted: false, correlationId, reason: "feature_disabled" };
    }

    if (!isValidPayload(command)) {
      return { accepted: false, correlationId, reason: "invalid_payload" };
    }

    const event: AuditEvent = {
      id: `audit-${createSeed()}`,
      eventType: AUDIT_EVENT_TYPE,
      domain: "other",
      orgId: command.tenant.orgId,
      propertyId: command.tenant.propertyId,
      correlationId,
      createdAt: new Date().toISOString(),
      payload: {
        actions: command.actions,
        capturedAt: new Date().toISOString(),
      },
    };

    const message = this.outboxQueue.enqueue(event as unknown as IntegrationEvent);
    await this.processOutboxMessage(message);

    return {
      accepted: true,
      correlationId,
      messageId: message.messageId,
    };
  }

  async getSnapshot(query: AuditQuery): Promise<AuditSnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.module || record.module === query.module)
      .filter((record) => !query.action || record.action === query.action)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }

  private async processOutboxMessage(message: OutboxMessage): Promise<void> {
    this.outboxQueue.markProcessing(message.messageId);
    const active = this.outboxQueue.listMessages().find((item) => item.messageId === message.messageId);
    if (!active) return;

    try {
      const publishResult = await this.eventBus.publish(active.event);
      if (publishResult.accepted) {
        this.outboxQueue.markSuccess(active.messageId);
        return;
      }
      this.outboxQueue.markFailure(active.messageId, `publish_${publishResult.reason ?? "rejected"}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown_error";
      this.outboxQueue.markFailure(active.messageId, errorMessage);
    }
  }
}
