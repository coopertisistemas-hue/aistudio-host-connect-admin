import {
  EventBus,
  IntegrationObservability,
  OutboxQueue,
  type IntegrationEvent,
  type OutboxMessage,
} from "@/integrations/hub";
import type { AlertSignal } from "@/modules/alerts/AlertRuleTypes";
import type { RecommendationSignal } from "@/modules/recommendations/RecommendationTypes";
import {
  extractWorkflowSignal,
  InternalWorkflowEventAdapter,
  type WorkflowEventAdapter,
} from "./WorkflowEventAdapter";
import {
  WORKFLOW_ALERT_SIGNAL_EVENT_TYPE,
  WORKFLOW_RECOMMENDATION_SIGNAL_EVENT_TYPE,
  type WorkflowSignalCommand,
  type WorkflowSignalResult,
  type WorkflowSignalSnapshot,
} from "./WorkflowEventTypes";

const createSeed = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const isWorkflowSignalsEnabled = (command: WorkflowSignalCommand): boolean => {
  const flag = command.featureFlags?.workflowSignals;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== command.tenant.orgId) return false;
  if (
    flag.propertyId !== undefined
    && (flag.propertyId ?? null) !== (command.tenant.propertyId ?? null)
  ) {
    return false;
  }

  return true;
};

const tenantKey = (orgId: string, propertyId?: string | null) => `${orgId}::${propertyId ?? "__all__"}`;

export class WorkflowSignalLayer {
  private readonly eventBus: EventBus;
  private readonly outboxQueue: OutboxQueue;
  private readonly adapter: WorkflowEventAdapter;
  private readonly signalStore = new Map<string, Map<string, ReturnType<typeof extractWorkflowSignal>>>();

  constructor(
    eventBus: EventBus,
    outboxQueue: OutboxQueue,
    adapter: WorkflowEventAdapter = new InternalWorkflowEventAdapter(),
  ) {
    this.eventBus = eventBus;
    this.outboxQueue = outboxQueue;
    this.adapter = adapter;

    this.eventBus.registerHandler({
      eventType: WORKFLOW_ALERT_SIGNAL_EVENT_TYPE,
      handle: async (event) => this.storeSignal(event as IntegrationEvent),
    });

    this.eventBus.registerHandler({
      eventType: WORKFLOW_RECOMMENDATION_SIGNAL_EVENT_TYPE,
      handle: async (event) => this.storeSignal(event as IntegrationEvent),
    });
  }

  static bootstrap(adapter?: WorkflowEventAdapter): {
    layer: WorkflowSignalLayer;
    eventBus: EventBus;
    outboxQueue: OutboxQueue;
    observability: IntegrationObservability;
  } {
    const observability = new IntegrationObservability();
    const eventBus = new EventBus(observability);
    const outboxQueue = new OutboxQueue({}, observability);
    const layer = new WorkflowSignalLayer(eventBus, outboxQueue, adapter);

    return { layer, eventBus, outboxQueue, observability };
  }

  async forwardSignals(command: WorkflowSignalCommand): Promise<WorkflowSignalResult> {
    const correlationId = command.correlationId ?? `corr-${createSeed()}`;
    if (!isWorkflowSignalsEnabled(command)) {
      return { accepted: false, correlationId, messageIds: [], reason: "feature_disabled" };
    }

    const alerts = command.alerts ?? [];
    const recommendations = command.recommendations ?? [];
    const messages: OutboxMessage[] = [];

    for (const alert of alerts) {
      const event = this.adapter.fromAlert(alert as AlertSignal, command.tenant, correlationId);
      const message = this.outboxQueue.enqueue(event);
      messages.push(message);
      await this.processOutboxMessage(message);
    }

    for (const recommendation of recommendations) {
      const event = this.adapter.fromRecommendation(
        recommendation as RecommendationSignal,
        command.tenant,
        correlationId,
      );
      const message = this.outboxQueue.enqueue(event);
      messages.push(message);
      await this.processOutboxMessage(message);
    }

    return {
      accepted: true,
      correlationId,
      messageIds: messages.map((message) => message.messageId),
    };
  }

  getSnapshot(tenant: { orgId: string; propertyId?: string | null }): WorkflowSignalSnapshot {
    const key = tenantKey(tenant.orgId, tenant.propertyId);
    const records = Array.from((this.signalStore.get(key) ?? new Map()).values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    return {
      tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }

  private async processOutboxMessage(message: OutboxMessage): Promise<void> {
    this.outboxQueue.markProcessing(message.messageId);
    const current = this.outboxQueue
      .listMessages()
      .find((storedMessage) => storedMessage.messageId === message.messageId);
    if (!current) return;

    try {
      const publishResult = await this.eventBus.publish(current.event);
      if (publishResult.accepted) {
        this.outboxQueue.markSuccess(current.messageId);
      } else {
        this.outboxQueue.markFailure(current.messageId, `publish_${publishResult.reason ?? "rejected"}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown_error";
      this.outboxQueue.markFailure(current.messageId, errorMessage);
    }
  }

  private async storeSignal(event: IntegrationEvent): Promise<void> {
    const signal = (event.payload as { signal: ReturnType<typeof extractWorkflowSignal> }).signal;
    const key = tenantKey(event.orgId, event.propertyId);
    const tenantSignals = this.signalStore.get(key) ?? new Map();

    tenantSignals.set(signal.workflowSignalId, signal);
    this.signalStore.set(key, tenantSignals);
  }
}
