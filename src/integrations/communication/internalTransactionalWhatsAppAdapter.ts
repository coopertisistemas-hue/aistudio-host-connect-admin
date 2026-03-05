import type {
  TransactionalWhatsAppPayload,
  WhatsAppDispatchRecord,
} from "./whatsappTypes";
import type { TenantContext } from "./types";

export interface TransactionalWhatsAppAdapterSendInput {
  messageId: string;
  correlationId: string;
  tenant: TenantContext;
  payload: TransactionalWhatsAppPayload;
}

export interface TransactionalWhatsAppAdapterSendResult {
  providerMessageId: string;
  acceptedAt: string;
}

export interface TransactionalWhatsAppAdapter {
  send(
    input: TransactionalWhatsAppAdapterSendInput,
  ): Promise<TransactionalWhatsAppAdapterSendResult>;
}

const buildProviderMessageId = (messageId: string) =>
  `internal-whatsapp-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

export class InternalTransactionalWhatsAppAdapter
  implements TransactionalWhatsAppAdapter
{
  private readonly sentRecords: WhatsAppDispatchRecord[] = [];

  async send(
    input: TransactionalWhatsAppAdapterSendInput,
  ): Promise<TransactionalWhatsAppAdapterSendResult> {
    const acceptedAt = new Date().toISOString();
    const providerMessageId = buildProviderMessageId(input.messageId);

    this.sentRecords.push({
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      destinationPhone: input.payload.recipient.phoneNumber,
      template: input.payload.template,
      status: "sent",
      sentAt: acceptedAt,
      providerMessageId,
    });

    return {
      providerMessageId,
      acceptedAt,
    };
  }

  listSentRecords(): WhatsAppDispatchRecord[] {
    return [...this.sentRecords];
  }
}
