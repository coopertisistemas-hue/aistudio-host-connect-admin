import type {
  AnalyticsTenantContext,
  ConversionFunnelPayload,
  ConversionFunnelQuery,
  ConversionFunnelRecord,
  ConversionFunnelSnapshot,
  FunnelStage,
} from "./types";

export interface ConversionFunnelAdapterIngestInput {
  messageId: string;
  correlationId: string;
  tenant: AnalyticsTenantContext;
  payload: ConversionFunnelPayload;
}

export interface ConversionFunnelAdapterIngestResult {
  funnelRecordId: string;
  acceptedAt: string;
}

export interface ConversionFunnelAdapter {
  upsertStage(
    input: ConversionFunnelAdapterIngestInput,
  ): Promise<ConversionFunnelAdapterIngestResult>;
  snapshot(query: ConversionFunnelQuery): Promise<ConversionFunnelSnapshot>;
}

const createTenantKey = (tenant: AnalyticsTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createFunnelRecordId = (
  campaign: string,
  clickIdentifier: string | undefined,
  leadId: string | undefined,
  reservationId: string | undefined,
): string =>
  `funnel-${campaign}-${clickIdentifier ?? "no-click"}-${leadId ?? "no-lead"}-${reservationId ?? "no-reservation"}`
    .replace(/[^a-zA-Z0-9-]/g, "-");

const mergeStage = (existing: FunnelStage[], next: FunnelStage): FunnelStage[] => {
  if (existing.includes(next)) return existing;
  return [...existing, next];
};

export class InternalConversionFunnelAdapter implements ConversionFunnelAdapter {
  private readonly recordsByTenant = new Map<string, Map<string, ConversionFunnelRecord>>();

  async upsertStage(
    input: ConversionFunnelAdapterIngestInput,
  ): Promise<ConversionFunnelAdapterIngestResult> {
    const tenantKey = createTenantKey(input.tenant);
    const signal = input.payload.signal;
    const funnelRecordId = createFunnelRecordId(
      signal.campaign,
      signal.clickIdentifier,
      signal.leadId,
      signal.reservationId,
    );
    const acceptedAt = new Date().toISOString();

    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();
    const existing = tenantRecords.get(funnelRecordId);

    const nextRecord: ConversionFunnelRecord = {
      funnelRecordId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      campaign: signal.campaign,
      source: signal.source,
      medium: signal.medium,
      clickIdentifier: signal.clickIdentifier,
      leadId: signal.leadId ?? existing?.leadId,
      reservationId: signal.reservationId ?? existing?.reservationId,
      stages: mergeStage(existing?.stages ?? [], signal.stage),
      firstSeenAt: existing?.firstSeenAt ?? signal.occurredAt,
      lastSeenAt: signal.occurredAt,
      metadata: {
        ...(existing?.metadata ?? {}),
        ...(signal.metadata ?? {}),
      },
    };

    tenantRecords.set(funnelRecordId, nextRecord);
    this.recordsByTenant.set(tenantKey, tenantRecords);

    return {
      funnelRecordId,
      acceptedAt,
    };
  }

  async snapshot(query: ConversionFunnelQuery): Promise<ConversionFunnelSnapshot> {
    const tenantKey = createTenantKey(query.tenant);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();

    const records = Array.from(tenantRecords.values())
      .filter((record) => !query.campaign || record.campaign === query.campaign)
      .filter(
        (record) =>
          !query.clickIdentifier || record.clickIdentifier === query.clickIdentifier,
      )
      .filter((record) => !query.leadId || record.leadId === query.leadId)
      .filter(
        (record) =>
          !query.reservationId || record.reservationId === query.reservationId,
      )
      .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
