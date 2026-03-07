import type {
  MetaAdsIngestionPayload,
  MetaAdsMetricRecord,
  MetaAdsMetricsQuery,
  MetaAdsMetricsSnapshot,
  PaidTrafficTenantContext,
} from "./types";

export interface MetaAdsAdapterIngestInput {
  messageId: string;
  correlationId: string;
  tenant: PaidTrafficTenantContext;
  payload: MetaAdsIngestionPayload;
}

export interface MetaAdsAdapterIngestResult {
  metricRecordId: string;
  acceptedAt: string;
}

export interface MetaAdsAdapter {
  ingest(input: MetaAdsAdapterIngestInput): Promise<MetaAdsAdapterIngestResult>;
  snapshot(query: MetaAdsMetricsQuery): Promise<MetaAdsMetricsSnapshot>;
}

const createTenantKey = (tenant: PaidTrafficTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createMetricRecordId = (
  campaignId: string,
  adSetId: string | undefined,
  adId: string | undefined,
  occurredAt: string,
): string =>
  `meta-metric-${campaignId}-${adSetId ?? "no-adset"}-${adId ?? "no-ad"}-${occurredAt}`.replace(
    /[^a-zA-Z0-9-]/g,
    "-",
  );

export class InternalMetaAdsAdapter implements MetaAdsAdapter {
  private readonly recordsByTenant = new Map<string, Map<string, MetaAdsMetricRecord>>();

  async ingest(input: MetaAdsAdapterIngestInput): Promise<MetaAdsAdapterIngestResult> {
    const tenantKey = createTenantKey(input.tenant);
    const metrics = input.payload.metrics;
    const metricRecordId = createMetricRecordId(
      metrics.campaignId,
      metrics.adSetId,
      metrics.adId,
      metrics.occurredAt,
    );
    const acceptedAt = new Date().toISOString();

    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();
    tenantRecords.set(metricRecordId, {
      metricRecordId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      campaignId: metrics.campaignId,
      adSetId: metrics.adSetId,
      adId: metrics.adId,
      objective: metrics.objective,
      spendAmount: metrics.spendAmount,
      currency: metrics.currency,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      conversions: metrics.conversions,
      occurredAt: metrics.occurredAt,
      metadata: metrics.metadata,
      updatedAt: acceptedAt,
    });
    this.recordsByTenant.set(tenantKey, tenantRecords);

    return {
      metricRecordId,
      acceptedAt,
    };
  }

  async snapshot(query: MetaAdsMetricsQuery): Promise<MetaAdsMetricsSnapshot> {
    const tenantKey = createTenantKey(query.tenant);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();
    const records = Array.from(tenantRecords.values())
      .filter((record) => !query.campaignId || record.campaignId === query.campaignId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
