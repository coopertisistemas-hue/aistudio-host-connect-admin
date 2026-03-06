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

export const HOUSEKEEPING_BOARD_EVENT_TYPE =
  "operations.housekeeping.board.ingest.requested";

export type HousekeepingPriority = "low" | "normal" | "high" | "urgent";

export type HousekeepingTaskStatus =
  | "pending"
  | "in_progress"
  | "inspected"
  | "done"
  | "blocked";

export interface HousekeepingBoardTaskInput {
  taskId: string;
  roomId: string;
  reservationId?: string;
  status: HousekeepingTaskStatus;
  priority: HousekeepingPriority;
  assignedTo?: string;
  dueAt?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface HousekeepingBoardIngestionCommand {
  tenant: OperationsTenantContext;
  correlationId?: string;
  boardId?: string;
  task: HousekeepingBoardTaskInput;
  featureFlags?: {
    housekeepingBoard?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface HousekeepingBoardIngestionPayload {
  boardId: string;
  task: HousekeepingBoardTaskInput;
  ingestedAt: string;
}

export type HousekeepingBoardEvent = IntegrationEvent<HousekeepingBoardIngestionPayload>;

export interface HousekeepingBoardIngestionResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_task";
}

export interface HousekeepingBoardTaskRecord {
  boardTaskId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  boardId: string;
  taskId: string;
  roomId: string;
  reservationId?: string;
  status: HousekeepingTaskStatus;
  priority: HousekeepingPriority;
  assignedTo?: string;
  dueAt?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  updatedAt: string;
}

export interface HousekeepingBoardQuery {
  tenant: OperationsTenantContext;
  boardId?: string;
}

export interface HousekeepingBoardSnapshot {
  boardId: string;
  tenant: OperationsTenantContext;
  tasks: HousekeepingBoardTaskRecord[];
  generatedAt: string;
}
