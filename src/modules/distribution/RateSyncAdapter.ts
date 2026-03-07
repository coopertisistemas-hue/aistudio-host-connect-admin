import type { RateSyncRecord } from "./RateSyncTypes";

export const buildRateSyncIdempotencyKey = (
  orgId: string,
  propertyId: string | null | undefined,
  provider: string,
  ratePlanId: string,
  roomTypeId: string,
  date: string,
): string =>
  [orgId, propertyId ?? "__all", provider, ratePlanId, roomTypeId, date, "rate_sync"].join(":");

export class RateSyncAdapter {
  deriveRecord(input: {
    orgId: string;
    propertyId?: string | null;
    provider: string;
    date: string;
    internalRoomTypeId: string;
    internalRatePlanId: string;
    mappedChannelRatePlanCode: string;
    baseRate: number;
    suggestedRate: number;
    correlationId: string;
  }): Omit<RateSyncRecord, "syncId" | "updatedAt"> {
    return {
      orgId: input.orgId,
      propertyId: input.propertyId,
      provider: input.provider,
      date: input.date,
      internalRoomTypeId: input.internalRoomTypeId,
      internalRatePlanId: input.internalRatePlanId,
      mappedChannelRatePlanCode: input.mappedChannelRatePlanCode,
      baseRate: Number(input.baseRate.toFixed(2)),
      suggestedRate: Number(input.suggestedRate.toFixed(2)),
      idempotencyKey: buildRateSyncIdempotencyKey(
        input.orgId,
        input.propertyId,
        input.provider,
        input.internalRatePlanId,
        input.internalRoomTypeId,
        input.date,
      ),
      replaySafe: true,
      advisoryOnly: true,
      correlationId: input.correlationId,
      explainability: {
        source: "pricing_rules_plus_tariff",
        notes: ["advisory_only", "no_provider_call"],
      },
    };
  }
}
