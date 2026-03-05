import type {
  EmailMarketingCampaignPayload,
  MarketingDispatchRecord,
  MarketingTenantContext,
} from "./types";

export interface EmailMarketingAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: MarketingTenantContext;
  payload: EmailMarketingCampaignPayload;
}

export interface EmailMarketingAdapterResult {
  dispatchId: string;
  processedAt: string;
}

export interface EmailMarketingAdapter {
  dispatchCampaign(input: EmailMarketingAdapterInput): Promise<EmailMarketingAdapterResult>;
}

const createDispatchId = (messageId: string) =>
  `marketing-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

export class InternalEmailMarketingAdapter implements EmailMarketingAdapter {
  private readonly dispatches: MarketingDispatchRecord[] = [];

  async dispatchCampaign(
    input: EmailMarketingAdapterInput,
  ): Promise<EmailMarketingAdapterResult> {
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

  listDispatches(): MarketingDispatchRecord[] {
    return [...this.dispatches];
  }
}
