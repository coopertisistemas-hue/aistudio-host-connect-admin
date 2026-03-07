import type { IntegrationEvent } from "@/integrations/hub";
import type { DistributionTenantContext } from "./ChannelAbstractionTypes";

export const RESERVATION_INGESTION_EVENT_TYPE = "distribution.reservation.ingestion.requested";

export interface ReservationIngestionFeatureFlags {
  reservationIngestionBaseline?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface InboundGuestInfo {
  fullName: string;
  email?: string;
  phoneNumber?: string;
}

export interface InboundReservationInput {
  provider: string;
  providerReservationId: string;
  channelPropertyCode: string;
  channelRoomCode: string;
  channelRatePlanCode?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  currency: "BRL" | "USD" | "EUR";
  guest: InboundGuestInfo;
  metadata?: Record<string, unknown>;
}

export interface ReservationIngestionCommand {
  tenant: DistributionTenantContext;
  correlationId?: string;
  inbound: InboundReservationInput;
  featureFlags?: ReservationIngestionFeatureFlags;
}

export interface ReservationIngestionPayload {
  inbound: InboundReservationInput;
  capturedAt: string;
}

export type ReservationIngestionEvent = IntegrationEvent<ReservationIngestionPayload>;

export interface ReservationIngestionRecord {
  ingestionId: string;
  orgId: string;
  propertyId?: string | null;
  provider: string;
  providerReservationId: string;
  idempotencyKey: string;
  replaySafe: true;
  canonicalInboundReservation: {
    checkIn: string;
    checkOut: string;
    guests: number;
    totalAmount: number;
    currency: "BRL" | "USD" | "EUR";
    guest: InboundGuestInfo;
  };
  sideEffects: {
    reservationCreated: false;
    pmsMutationPerformed: false;
  };
  advisoryOnly: true;
  correlationId: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ReservationIngestionResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface ReservationIngestionQuery {
  tenant: DistributionTenantContext;
  provider?: string;
  providerReservationId?: string;
}

export interface ReservationIngestionSnapshot {
  tenant: DistributionTenantContext;
  records: ReservationIngestionRecord[];
  generatedAt: string;
}
