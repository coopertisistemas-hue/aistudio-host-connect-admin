import type {
  HousekeepingBoardIngestionPayload,
  HousekeepingBoardQuery,
  HousekeepingBoardSnapshot,
  HousekeepingBoardTaskRecord,
  OperationsTenantContext,
} from "./types";

export interface HousekeepingBoardAdapterIngestInput {
  messageId: string;
  correlationId: string;
  tenant: OperationsTenantContext;
  payload: HousekeepingBoardIngestionPayload;
}

export interface HousekeepingBoardAdapterIngestResult {
  boardTaskId: string;
  acceptedAt: string;
}

export interface HousekeepingBoardAdapter {
  ingest(
    input: HousekeepingBoardAdapterIngestInput,
  ): Promise<HousekeepingBoardAdapterIngestResult>;
  snapshot(query: HousekeepingBoardQuery): Promise<HousekeepingBoardSnapshot>;
}

const createTenantKey = (tenant: OperationsTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createBoardTaskId = (boardId: string, taskId: string): string =>
  `housekeeping-task-${boardId}-${taskId}`.replace(/[^a-zA-Z0-9-]/g, "-");

export class InternalHousekeepingBoardAdapter implements HousekeepingBoardAdapter {
  private readonly recordsByTenant = new Map<string, Map<string, HousekeepingBoardTaskRecord>>();

  async ingest(
    input: HousekeepingBoardAdapterIngestInput,
  ): Promise<HousekeepingBoardAdapterIngestResult> {
    const tenantKey = createTenantKey(input.tenant);
    const boardTaskId = createBoardTaskId(input.payload.boardId, input.payload.task.taskId);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();
    const acceptedAt = new Date().toISOString();

    tenantRecords.set(boardTaskId, {
      boardTaskId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      boardId: input.payload.boardId,
      taskId: input.payload.task.taskId,
      roomId: input.payload.task.roomId,
      reservationId: input.payload.task.reservationId,
      status: input.payload.task.status,
      priority: input.payload.task.priority,
      assignedTo: input.payload.task.assignedTo,
      dueAt: input.payload.task.dueAt,
      notes: input.payload.task.notes,
      metadata: input.payload.task.metadata,
      updatedAt: acceptedAt,
    });

    this.recordsByTenant.set(tenantKey, tenantRecords);

    return {
      boardTaskId,
      acceptedAt,
    };
  }

  async snapshot(query: HousekeepingBoardQuery): Promise<HousekeepingBoardSnapshot> {
    const boardId = query.boardId ?? "housekeeping-main";
    const tenantKey = createTenantKey(query.tenant);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();

    const tasks = Array.from(tenantRecords.values())
      .filter((record) => record.boardId === boardId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      boardId,
      tenant: query.tenant,
      tasks,
      generatedAt: new Date().toISOString(),
    };
  }
}
