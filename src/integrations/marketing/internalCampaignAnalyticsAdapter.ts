import type {
  CampaignAnalyticsPayload,
  CampaignAnalyticsRecord,
} from "./campaignAnalyticsTypes";

export interface CampaignAnalyticsAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: {
    orgId: string;
    propertyId?: string | null;
  };
  payload: CampaignAnalyticsPayload;
}

export interface CampaignAnalyticsAdapterResult {
  analyticsId: string;
  recordedAt: string;
}

export interface CampaignAnalyticsAdapter {
  record(input: CampaignAnalyticsAdapterInput): Promise<CampaignAnalyticsAdapterResult>;
}

const calculateRate = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return Number((numerator / denominator).toFixed(4));
};

const createAnalyticsId = (messageId: string) =>
  `analytics-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

export class InternalCampaignAnalyticsAdapter implements CampaignAnalyticsAdapter {
  private readonly records: CampaignAnalyticsRecord[] = [];

  async record(
    input: CampaignAnalyticsAdapterInput,
  ): Promise<CampaignAnalyticsAdapterResult> {
    const recordedAt = new Date().toISOString();
    const analyticsId = createAnalyticsId(input.messageId);

    this.records.push({
      analyticsId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      channel: input.payload.channel,
      campaignName: input.payload.campaignName,
      metrics: input.payload.metrics,
      openRate: calculateRate(input.payload.metrics.opened, input.payload.metrics.sent),
      clickRate: calculateRate(input.payload.metrics.clicked, input.payload.metrics.sent),
      conversionRate: calculateRate(input.payload.metrics.converted, input.payload.metrics.sent),
      capturedAt: input.payload.capturedAt,
    });

    return { analyticsId, recordedAt };
  }

  listRecords(): CampaignAnalyticsRecord[] {
    return [...this.records];
  }
}
