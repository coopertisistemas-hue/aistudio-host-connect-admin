import type {
  OtaMappingPayload,
  OtaMappingQuery,
  OtaMappingRecord,
  OtaMappingSnapshot,
  DistributionTenantContext,
} from "./OtaMappingTypes";

export interface OtaMappingAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: DistributionTenantContext;
  payload: OtaMappingPayload;
}

export interface OtaMappingAdapter {
  upsert(input: OtaMappingAdapterInput): Promise<void>;
  snapshot(query: OtaMappingQuery): Promise<OtaMappingSnapshot>;
}

const normalizeList = <T extends Record<string, string>>(items: T[], key: keyof T): T[] =>
  [...items].sort((a, b) => a[key].localeCompare(b[key]));

const deterministicHash = (value: string): string => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return `h${Math.abs(hash)}`;
};

const mappingKey = (orgId: string, propertyId: string | null | undefined, provider: string) =>
  `${orgId}:${propertyId ?? "__all"}:${provider}`;

export class InternalOtaMappingAdapter implements OtaMappingAdapter {
  private readonly records = new Map<string, OtaMappingRecord>();

  async upsert(input: OtaMappingAdapterInput): Promise<void> {
    const mapping = input.payload.mapping;
    const rooms = normalizeList(mapping.rooms, "internalRoomTypeId");
    const ratePlans = normalizeList(mapping.ratePlans, "internalRatePlanId");
    const serialized = JSON.stringify({
      provider: mapping.provider,
      property: mapping.property,
      rooms,
      ratePlans,
      mappingVersion: mapping.mappingVersion,
    });

    const key = mappingKey(input.tenant.orgId, input.tenant.propertyId, mapping.provider);

    this.records.set(key, {
      recordId: key,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      provider: mapping.provider,
      property: mapping.property,
      rooms,
      ratePlans,
      mappingVersion: mapping.mappingVersion,
      deterministicHash: deterministicHash(serialized),
      advisoryOnly: true,
      correlationId: input.correlationId,
      updatedAt: new Date().toISOString(),
    });
  }

  async snapshot(query: OtaMappingQuery): Promise<OtaMappingSnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.provider || record.provider === query.provider)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
