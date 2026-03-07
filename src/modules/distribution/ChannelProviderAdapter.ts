import type {
  ChannelAbstractionPayload,
  ChannelAbstractionQuery,
  ChannelAbstractionRecord,
  ChannelAbstractionSnapshot,
  DistributionTenantContext,
  IdempotencyKeyShape,
} from "./ChannelAbstractionTypes";

export interface ChannelProviderAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: DistributionTenantContext;
  payload: ChannelAbstractionPayload;
}

export interface ChannelProviderAdapter {
  upsertChannel(input: ChannelProviderAdapterInput): Promise<void>;
  snapshot(query: ChannelAbstractionQuery): Promise<ChannelAbstractionSnapshot>;
}

export const buildIdempotencyTemplate = (shape: IdempotencyKeyShape): string =>
  [
    shape.orgId,
    shape.propertyId ?? "__all__",
    shape.provider,
    shape.operation,
    shape.externalReference ?? "__none__",
    shape.dateScope ?? "__none__",
  ].join(":");

const recordKey = (orgId: string, propertyId: string | null | undefined, provider: string, accountId: string) =>
  `${orgId}:${propertyId ?? "__all"}:${provider}:${accountId}`;

export class InternalChannelProviderAdapter implements ChannelProviderAdapter {
  private readonly records = new Map<string, ChannelAbstractionRecord>();

  async upsertChannel(input: ChannelProviderAdapterInput): Promise<void> {
    const { channel, idempotency } = input.payload;
    const key = recordKey(
      input.tenant.orgId,
      input.tenant.propertyId,
      channel.provider,
      channel.channelAccountId,
    );

    this.records.set(key, {
      recordId: key,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      provider: channel.provider,
      channelAccountId: channel.channelAccountId,
      channelPropertyCode: channel.channelPropertyCode,
      capabilities: channel.capabilities,
      idempotencyKeyTemplate: buildIdempotencyTemplate(idempotency),
      advisoryOnly: true,
      correlationId: input.correlationId,
      updatedAt: new Date().toISOString(),
      metadata: channel.metadata,
    });
  }

  async snapshot(query: ChannelAbstractionQuery): Promise<ChannelAbstractionSnapshot> {
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
