import type { InboundReservationInput, ReservationIngestionRecord } from "./ReservationIngestionTypes";

export const buildReservationIngestionIdempotencyKey = (
  orgId: string,
  propertyId: string | null | undefined,
  provider: string,
  providerReservationId: string,
): string =>
  [orgId, propertyId ?? "__all", provider, providerReservationId, "reservation_ingestion"].join(":");

export class ReservationIngestionAdapter {
  deriveRecord(input: {
    orgId: string;
    propertyId?: string | null;
    inbound: InboundReservationInput;
    correlationId: string;
  }): Omit<ReservationIngestionRecord, "ingestionId" | "updatedAt"> {
    return {
      orgId: input.orgId,
      propertyId: input.propertyId,
      provider: input.inbound.provider,
      providerReservationId: input.inbound.providerReservationId,
      idempotencyKey: buildReservationIngestionIdempotencyKey(
        input.orgId,
        input.propertyId,
        input.inbound.provider,
        input.inbound.providerReservationId,
      ),
      replaySafe: true,
      canonicalInboundReservation: {
        checkIn: input.inbound.checkIn,
        checkOut: input.inbound.checkOut,
        guests: input.inbound.guests,
        totalAmount: input.inbound.totalAmount,
        currency: input.inbound.currency,
        guest: input.inbound.guest,
      },
      sideEffects: {
        reservationCreated: false,
        pmsMutationPerformed: false,
      },
      advisoryOnly: true,
      correlationId: input.correlationId,
      metadata: input.inbound.metadata,
    };
  }
}
