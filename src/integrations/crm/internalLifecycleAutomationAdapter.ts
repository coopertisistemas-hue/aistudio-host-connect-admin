import type {
  GuestLifecyclePayload,
  LifecycleDispatchRecord,
  LifecycleTenantContext,
} from "./lifecycleTypes";

export interface LifecycleAutomationAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: LifecycleTenantContext;
  payload: GuestLifecyclePayload;
}

export interface LifecycleAutomationAdapterResult {
  automationId: string;
  processedAt: string;
}

export interface LifecycleAutomationAdapter {
  dispatch(input: LifecycleAutomationAdapterInput): Promise<LifecycleAutomationAdapterResult>;
}

const createAutomationId = (messageId: string) =>
  `automation-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

export class InternalLifecycleAutomationAdapter implements LifecycleAutomationAdapter {
  private readonly records: LifecycleDispatchRecord[] = [];

  async dispatch(
    input: LifecycleAutomationAdapterInput,
  ): Promise<LifecycleAutomationAdapterResult> {
    const processedAt = new Date().toISOString();
    const automationId = createAutomationId(input.messageId);

    this.records.push({
      automationId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      action: input.payload.action,
      recipient: input.payload.recipient,
      scheduleAt: input.payload.scheduleAt,
      processedAt,
    });

    return { automationId, processedAt };
  }

  listDispatches(): LifecycleDispatchRecord[] {
    return [...this.records];
  }
}
