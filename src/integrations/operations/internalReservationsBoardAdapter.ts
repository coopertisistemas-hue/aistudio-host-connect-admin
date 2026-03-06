import type {
  OperationsTenantContext,
  ReservationsBoardCardRecord,
  ReservationsBoardIngestionPayload,
  ReservationsBoardQuery,
  ReservationsBoardSnapshot,
} from "./types";

export interface ReservationsBoardAdapterIngestInput {
  messageId: string;
  correlationId: string;
  tenant: OperationsTenantContext;
  payload: ReservationsBoardIngestionPayload;
}

export interface ReservationsBoardAdapterIngestResult {
  boardCardId: string;
  acceptedAt: string;
}

export interface ReservationsBoardAdapter {
  ingest(
    input: ReservationsBoardAdapterIngestInput,
  ): Promise<ReservationsBoardAdapterIngestResult>;
  snapshot(query: ReservationsBoardQuery): Promise<ReservationsBoardSnapshot>;
}

const createTenantKey = (tenant: OperationsTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createBoardCardId = (boardId: string, reservationId: string): string =>
  `board-card-${boardId}-${reservationId}`.replace(/[^a-zA-Z0-9-]/g, "-");

export class InternalReservationsBoardAdapter implements ReservationsBoardAdapter {
  private readonly recordsByTenant = new Map<string, Map<string, ReservationsBoardCardRecord>>();

  async ingest(
    input: ReservationsBoardAdapterIngestInput,
  ): Promise<ReservationsBoardAdapterIngestResult> {
    const tenantKey = createTenantKey(input.tenant);
    const boardCardId = createBoardCardId(
      input.payload.boardId,
      input.payload.card.reservationId,
    );

    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();
    const acceptedAt = new Date().toISOString();

    tenantRecords.set(boardCardId, {
      boardCardId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      boardId: input.payload.boardId,
      reservationId: input.payload.card.reservationId,
      guestName: input.payload.card.guestName,
      checkInDate: input.payload.card.checkInDate,
      checkOutDate: input.payload.card.checkOutDate,
      channel: input.payload.card.channel,
      status: input.payload.card.status,
      totalAmount: input.payload.card.totalAmount,
      currency: input.payload.card.currency,
      metadata: input.payload.card.metadata,
      updatedAt: acceptedAt,
    });

    this.recordsByTenant.set(tenantKey, tenantRecords);

    return {
      boardCardId,
      acceptedAt,
    };
  }

  async snapshot(query: ReservationsBoardQuery): Promise<ReservationsBoardSnapshot> {
    const boardId = query.boardId ?? "reservations-main";
    const tenantKey = createTenantKey(query.tenant);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();

    const cards = Array.from(tenantRecords.values())
      .filter((record) => record.boardId === boardId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      boardId,
      tenant: query.tenant,
      cards,
      generatedAt: new Date().toISOString(),
    };
  }
}
