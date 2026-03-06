import type { IntegrationEvent } from "../hub";

export const RESERVATIONS_BOARD_EVENT_TYPE =
  "operations.reservations.board.ingest.requested";

export type BoardColumnId =
  | "new"
  | "confirmed"
  | "check_in_today"
  | "in_house"
  | "check_out_today"
  | "completed"
  | "cancelled";

export interface OperationsTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface ReservationBoardCardInput {
  reservationId: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  channel: "direct" | "ota" | "walk_in" | "other";
  status: BoardColumnId;
  totalAmount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
}

export interface ReservationsBoardIngestionCommand {
  tenant: OperationsTenantContext;
  correlationId?: string;
  boardId?: string;
  card: ReservationBoardCardInput;
  featureFlags?: {
    reservationsBoard?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface ReservationsBoardIngestionPayload {
  boardId: string;
  card: ReservationBoardCardInput;
  ingestedAt: string;
}

export type ReservationsBoardEvent = IntegrationEvent<ReservationsBoardIngestionPayload>;

export interface ReservationsBoardIngestionResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_card";
}

export interface ReservationsBoardCardRecord {
  boardCardId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  boardId: string;
  reservationId: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  channel: "direct" | "ota" | "walk_in" | "other";
  status: BoardColumnId;
  totalAmount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface ReservationsBoardQuery {
  tenant: OperationsTenantContext;
  boardId?: string;
}

export interface ReservationsBoardSnapshot {
  boardId: string;
  tenant: OperationsTenantContext;
  cards: ReservationsBoardCardRecord[];
  generatedAt: string;
}
