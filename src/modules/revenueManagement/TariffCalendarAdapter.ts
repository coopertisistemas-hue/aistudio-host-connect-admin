import type {
  RevenueTenantContext,
  TariffCalendarPayload,
  TariffCalendarQuery,
  TariffCalendarRecord,
  TariffCalendarSnapshot,
} from "./TariffCalendarTypes";

export interface TariffCalendarAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: RevenueTenantContext;
  payload: TariffCalendarPayload;
}

export interface TariffCalendarAdapter {
  upsert(input: TariffCalendarAdapterInput): Promise<void>;
  snapshot(query: TariffCalendarQuery): Promise<TariffCalendarSnapshot>;
}

const createRecordId = (orgId: string, propertyId: string | null | undefined, date: string) =>
  `${orgId}:${propertyId ?? "__all"}:${date}`;

export class InMemoryTariffCalendarAdapter implements TariffCalendarAdapter {
  private readonly records = new Map<string, TariffCalendarRecord>();

  async upsert(input: TariffCalendarAdapterInput): Promise<void> {
    const now = new Date().toISOString();

    for (const entry of input.payload.entries) {
      const recordId = createRecordId(input.tenant.orgId, input.tenant.propertyId, entry.date);
      this.records.set(recordId, {
        recordId,
        orgId: input.tenant.orgId,
        propertyId: input.tenant.propertyId,
        date: entry.date,
        baseRate: entry.baseRate,
        constraints: {
          minStayNights: entry.minStayNights,
          maxStayNights: entry.maxStayNights,
          closedToArrival: entry.closedToArrival ?? false,
          closedToDeparture: entry.closedToDeparture ?? false,
        },
        tags: entry.tags ?? [],
        explainability: {
          reasonCode: entry.explainability?.reasonCode ?? "manual_baseline",
          details: entry.explainability?.details,
        },
        advisoryOnly: true,
        correlationId: input.correlationId,
        updatedAt: now,
      });
    }
  }

  async snapshot(query: TariffCalendarQuery): Promise<TariffCalendarSnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.dateFrom || record.date >= query.dateFrom)
      .filter((record) => !query.dateTo || record.date <= query.dateTo)
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
