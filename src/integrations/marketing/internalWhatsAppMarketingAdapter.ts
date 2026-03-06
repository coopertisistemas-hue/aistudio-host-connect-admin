import type {
  WhatsAppCampaignDispatchRecord,
  WhatsAppMarketingCampaignPayload,
} from "./whatsappCampaignTypes";

export interface WhatsAppMarketingAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: {
    orgId: string;
    propertyId?: string | null;
  };
  payload: WhatsAppMarketingCampaignPayload;
}

export interface WhatsAppMarketingAdapterResult {
  dispatchId: string;
  processedAt: string;
}

export interface WhatsAppMarketingAdapter {
  dispatchCampaign(
    input: WhatsAppMarketingAdapterInput,
  ): Promise<WhatsAppMarketingAdapterResult>;
}

const createDispatchId = (messageId: string) =>
  `whatsapp-marketing-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

export class InternalWhatsAppMarketingAdapter implements WhatsAppMarketingAdapter {
  private readonly dispatches: WhatsAppCampaignDispatchRecord[] = [];

  async dispatchCampaign(
    input: WhatsAppMarketingAdapterInput,
  ): Promise<WhatsAppMarketingAdapterResult> {
    const processedAt = new Date().toISOString();
    const dispatchId = createDispatchId(input.messageId);

    this.dispatches.push({
      dispatchId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      campaignType: input.payload.campaignType,
      campaignName: input.payload.campaignName,
      recipientsCount: input.payload.audience.recipients.length,
      scheduleAt: input.payload.scheduleAt,
      processedAt,
    });

    return { dispatchId, processedAt };
  }

  listDispatches(): WhatsAppCampaignDispatchRecord[] {
    return [...this.dispatches];
  }
}
