import type {
  CompetitorRatePayload,
  CompetitorRateQuery,
  CompetitorRateRecord,
  CompetitorRateSnapshot,
  RevenueTenantContext,
} from "./CompetitorRateTypes";

export interface CompetitorRateAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: RevenueTenantContext;
  payload: CompetitorRatePayload;
}

export interface CompetitorRateAdapter {
  ingest(input: CompetitorRateAdapterInput): Promise<void>;
  snapshot(query: CompetitorRateQuery): Promise<CompetitorRateSnapshot>;
}

const recordKey = (
  orgId: string,
  propertyId: string | null | undefined,
  competitorId: string,
  date: string,
) => `${orgId}:${propertyId ?? "__all"}:${competitorId}:${date}`;

export class InternalCompetitorRateAdapter implements CompetitorRateAdapter {
  private readonly records = new Map<string, CompetitorRateRecord>();

  async ingest(input: CompetitorRateAdapterInput): Promise<void> {
    const now = new Date().toISOString();

    for (const rate of input.payload.rates) {
      const key = recordKey(
        input.tenant.orgId,
        input.tenant.propertyId,
        rate.competitorId,
        rate.date,
      );

      this.records.set(key, {
        recordId: key,
        orgId: input.tenant.orgId,
        propertyId: input.tenant.propertyId,
        competitorId: rate.competitorId,
        competitorName: rate.competitorName,
        date: rate.date,
        rate: rate.rate,
        currency: rate.currency,
        source: rate.source,
        explainability: {
          providerMode: "adapter_placeholder_only",
          note: "No direct provider integration in baseline phase.",
        },
        advisoryOnly: true,
        correlationId: input.correlationId,
        updatedAt: now,
        metadata: rate.metadata,
      });
    }
  }

  async snapshot(query: CompetitorRateQuery): Promise<CompetitorRateSnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.date || record.date === query.date)
      .filter((record) => !query.competitorId || record.competitorId === query.competitorId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
