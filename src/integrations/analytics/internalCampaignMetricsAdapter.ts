import type {
  AnalyticsTenantContext,
  CampaignMetricsPayload,
  CampaignMetricsQuery,
  CampaignMetricsRecord,
  CampaignMetricsSnapshot,
} from "./types";

export interface CampaignMetricsAdapterIngestInput {
  messageId: string;
  correlationId: string;
  tenant: AnalyticsTenantContext;
  payload: CampaignMetricsPayload;
}

export interface CampaignMetricsAdapterIngestResult {
  metricsRecordId: string;
  acceptedAt: string;
}

export interface CampaignMetricsAdapter {
  derive(
    input: CampaignMetricsAdapterIngestInput,
  ): Promise<CampaignMetricsAdapterIngestResult>;
  snapshot(query: CampaignMetricsQuery): Promise<CampaignMetricsSnapshot>;
}

const createTenantKey = (tenant: AnalyticsTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createMetricsRecordId = (
  campaign: string,
  source: string,
  medium: string,
  periodStart: string,
  periodEnd: string,
): string =>
  `campaign-metrics-${campaign}-${source}-${medium}-${periodStart}-${periodEnd}`.replace(
    /[^a-zA-Z0-9-]/g,
    "-",
  );

export class InternalCampaignMetricsAdapter implements CampaignMetricsAdapter {
  private readonly recordsByTenant = new Map<string, Map<string, CampaignMetricsRecord>>();

  async derive(
    input: CampaignMetricsAdapterIngestInput,
  ): Promise<CampaignMetricsAdapterIngestResult> {
    const tenantKey = createTenantKey(input.tenant);
    const metrics = input.payload.metrics;
    const metricsRecordId = createMetricsRecordId(
      metrics.campaign,
      metrics.source,
      metrics.medium,
      metrics.periodStart,
      metrics.periodEnd,
    );
    const acceptedAt = new Date().toISOString();
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();

    tenantRecords.set(metricsRecordId, {
      metricsRecordId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      campaign: metrics.campaign,
      source: metrics.source,
      medium: metrics.medium,
      reservationCount: metrics.reservationCount,
      totalRevenue: metrics.totalRevenue,
      conversionRate: metrics.conversionRate,
      revenuePerReservation:
        metrics.reservationCount > 0
          ? metrics.totalRevenue / metrics.reservationCount
          : 0,
      periodStart: metrics.periodStart,
      periodEnd: metrics.periodEnd,
      metadata: metrics.metadata,
      updatedAt: acceptedAt,
    });

    this.recordsByTenant.set(tenantKey, tenantRecords);

    return {
      metricsRecordId,
      acceptedAt,
    };
  }

  async snapshot(query: CampaignMetricsQuery): Promise<CampaignMetricsSnapshot> {
    const tenantKey = createTenantKey(query.tenant);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();

    const records = Array.from(tenantRecords.values())
      .filter((record) => !query.campaign || record.campaign === query.campaign)
      .filter((record) => !query.source || record.source === query.source)
      .filter((record) => !query.medium || record.medium === query.medium)
      .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));

    const totals = {
      revenueByCampaign: {} as Record<string, number>,
      reservationCountByCampaign: {} as Record<string, number>,
      revenuePerSource: {} as Record<string, number>,
      revenuePerMedium: {} as Record<string, number>,
    };

    for (const record of records) {
      totals.revenueByCampaign[record.campaign] =
        (totals.revenueByCampaign[record.campaign] ?? 0) + record.totalRevenue;
      totals.reservationCountByCampaign[record.campaign] =
        (totals.reservationCountByCampaign[record.campaign] ?? 0) +
        record.reservationCount;
      totals.revenuePerSource[record.source] =
        (totals.revenuePerSource[record.source] ?? 0) + record.totalRevenue;
      totals.revenuePerMedium[record.medium] =
        (totals.revenuePerMedium[record.medium] ?? 0) + record.totalRevenue;
    }

    return {
      tenant: query.tenant,
      records,
      totals,
      generatedAt: new Date().toISOString(),
    };
  }
}
