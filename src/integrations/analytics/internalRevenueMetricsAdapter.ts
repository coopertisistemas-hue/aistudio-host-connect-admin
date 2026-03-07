import type {
  AnalyticsTenantContext,
  RevenueMetricsPayload,
  RevenueMetricsQuery,
  RevenueMetricsRecord,
  RevenueMetricsSnapshot,
} from "./types";

export interface RevenueMetricsAdapterIngestInput {
  messageId: string;
  correlationId: string;
  tenant: AnalyticsTenantContext;
  payload: RevenueMetricsPayload;
}

export interface RevenueMetricsAdapterIngestResult {
  metricsRecordId: string;
  acceptedAt: string;
}

export interface RevenueMetricsAdapter {
  ingest(
    input: RevenueMetricsAdapterIngestInput,
  ): Promise<RevenueMetricsAdapterIngestResult>;
  snapshot(query: RevenueMetricsQuery): Promise<RevenueMetricsSnapshot>;
}

const createTenantKey = (tenant: AnalyticsTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createMetricsRecordId = (
  period: string,
  periodStart: string,
  periodEnd: string,
): string =>
  `revenue-${period}-${periodStart}-${periodEnd}`.replace(/[^a-zA-Z0-9-]/g, "-");

export class InternalRevenueMetricsAdapter implements RevenueMetricsAdapter {
  private readonly recordsByTenant = new Map<string, Map<string, RevenueMetricsRecord>>();

  async ingest(
    input: RevenueMetricsAdapterIngestInput,
  ): Promise<RevenueMetricsAdapterIngestResult> {
    const tenantKey = createTenantKey(input.tenant);
    const metrics = input.payload.metrics;
    const metricsRecordId = createMetricsRecordId(
      metrics.period,
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
      period: metrics.period,
      periodStart: metrics.periodStart,
      periodEnd: metrics.periodEnd,
      totalReservations: metrics.totalReservations,
      totalRevenue: metrics.totalRevenue,
      adr: metrics.adr,
      occupancySignal: metrics.occupancySignal,
      revenueByProperty: metrics.revenueByProperty,
      revenueByPeriod: metrics.revenueByPeriod,
      reservationCountByChannel: metrics.reservationCountByChannel,
      metadata: metrics.metadata,
      updatedAt: acceptedAt,
    });

    this.recordsByTenant.set(tenantKey, tenantRecords);

    return {
      metricsRecordId,
      acceptedAt,
    };
  }

  async snapshot(query: RevenueMetricsQuery): Promise<RevenueMetricsSnapshot> {
    const tenantKey = createTenantKey(query.tenant);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();

    const records = Array.from(tenantRecords.values())
      .filter((record) => !query.period || record.period === query.period)
      .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
