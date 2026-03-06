import type {
  EmailDispatchRecord,
  TransactionalEmailPayload,
  TenantContext,
} from "./types";

export interface TransactionalEmailAdapterSendInput {
  messageId: string;
  correlationId: string;
  tenant: TenantContext;
  payload: TransactionalEmailPayload;
}

export interface TransactionalEmailAdapterSendResult {
  providerMessageId: string;
  acceptedAt: string;
}

export interface TransactionalEmailAdapter {
  send(input: TransactionalEmailAdapterSendInput): Promise<TransactionalEmailAdapterSendResult>;
}

const buildProviderMessageId = (messageId: string) =>
  `internal-email-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

export class InternalTransactionalEmailAdapter implements TransactionalEmailAdapter {
  private readonly sentRecords: EmailDispatchRecord[] = [];

  async send(
    input: TransactionalEmailAdapterSendInput,
  ): Promise<TransactionalEmailAdapterSendResult> {
    const acceptedAt = new Date().toISOString();
    const providerMessageId = buildProviderMessageId(input.messageId);

    this.sentRecords.push({
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      recipientEmail: input.payload.recipient.email,
      template: input.payload.template,
      subject: input.payload.subject,
      status: "sent",
      sentAt: acceptedAt,
      providerMessageId,
    });

    return {
      providerMessageId,
      acceptedAt,
    };
  }

  listSentRecords(): EmailDispatchRecord[] {
    return [...this.sentRecords];
  }
}
