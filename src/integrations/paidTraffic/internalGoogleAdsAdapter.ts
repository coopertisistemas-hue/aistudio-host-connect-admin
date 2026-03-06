import type {
  GoogleAdsBaselinePayload,
  GoogleAdsBaselineQuery,
  GoogleAdsBaselineSnapshot,
  GoogleAdsCampaignBaselineRecord,
  PaidTrafficTenantContext,
} from "./types";

export interface GoogleAdsAdapterUpsertInput {
  messageId: string;
  correlationId: string;
  tenant: PaidTrafficTenantContext;
  payload: GoogleAdsBaselinePayload;
}

export interface GoogleAdsAdapterUpsertResult {
  syncId: string;
  syncedAt: string;
}

export interface GoogleAdsAdapter {
  upsert(input: GoogleAdsAdapterUpsertInput): Promise<GoogleAdsAdapterUpsertResult>;
  snapshot(query: GoogleAdsBaselineQuery): Promise<GoogleAdsBaselineSnapshot>;
}

const createTenantKey = (tenant: PaidTrafficTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createRecordKey = (accountId: string, campaignId: string): string =>
  `${accountId}::${campaignId}`;

const createSyncId = (messageId: string): string =>
  `gads-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

export class InternalGoogleAdsAdapter implements GoogleAdsAdapter {
  private readonly recordsByTenant = new Map<string, Map<string, GoogleAdsCampaignBaselineRecord>>();

  async upsert(input: GoogleAdsAdapterUpsertInput): Promise<GoogleAdsAdapterUpsertResult> {
    const tenantKey = createTenantKey(input.tenant);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();
    const syncedAt = new Date().toISOString();
    const syncId = createSyncId(input.messageId);
    const recordKey = createRecordKey(
      input.payload.campaign.accountId,
      input.payload.campaign.campaignId,
    );

    tenantRecords.set(recordKey, {
      syncId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      campaignId: input.payload.campaign.campaignId,
      campaignName: input.payload.campaign.campaignName,
      accountId: input.payload.campaign.accountId,
      objective: input.payload.campaign.objective,
      dailyBudgetMicros: input.payload.campaign.dailyBudgetMicros,
      currencyCode: input.payload.campaign.currencyCode,
      status: input.payload.campaign.status,
      startDate: input.payload.campaign.startDate,
      endDate: input.payload.campaign.endDate,
      geoTargeting: input.payload.campaign.geoTargeting,
      labels: input.payload.campaign.labels,
      metadata: input.payload.campaign.metadata,
      syncedAt,
    });

    this.recordsByTenant.set(tenantKey, tenantRecords);
    return { syncId, syncedAt };
  }

  async snapshot(query: GoogleAdsBaselineQuery): Promise<GoogleAdsBaselineSnapshot> {
    const tenantKey = createTenantKey(query.tenant);
    let records = Array.from((this.recordsByTenant.get(tenantKey) ?? new Map()).values());

    if (query.accountId) {
      records = records.filter((record) => record.accountId === query.accountId);
    }

    records.sort((a, b) => b.syncedAt.localeCompare(a.syncedAt));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
