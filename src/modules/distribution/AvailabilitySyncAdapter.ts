import type { AvailabilityDeltaInput, AvailabilitySyncRecord } from "./AvailabilitySyncTypes";

export const buildAvailabilityIdempotencyKey = (
  orgId: string,
  propertyId: string | null | undefined,
  provider: string,
  roomTypeId: string,
  date: string,
): string =>
  [orgId, propertyId ?? "__all", provider, roomTypeId, date, "availability_sync"].join(":");

export class AvailabilitySyncAdapter {
  deriveRecord(input: {
    orgId: string;
    propertyId?: string | null;
    provider: string;
    delta: AvailabilityDeltaInput;
    mappedChannelRoomCode: string;
    correlationId: string;
  }): Omit<AvailabilitySyncRecord, "syncId" | "updatedAt"> {
    return {
      orgId: input.orgId,
      propertyId: input.propertyId,
      provider: input.provider,
      targetDate: input.delta.date,
      internalRoomTypeId: input.delta.internalRoomTypeId,
      mappedChannelRoomCode: input.mappedChannelRoomCode,
      availableUnits: input.delta.availableUnits,
      idempotencyKey: buildAvailabilityIdempotencyKey(
        input.orgId,
        input.propertyId,
        input.provider,
        input.delta.internalRoomTypeId,
        input.delta.date,
      ),
      replaySafe: true,
      advisoryOnly: true,
      correlationId: input.correlationId,
    };
  }
}
