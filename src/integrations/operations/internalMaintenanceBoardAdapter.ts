import type {
  MaintenanceBoardIngestionPayload,
  MaintenanceBoardQuery,
  MaintenanceBoardSnapshot,
  MaintenanceBoardTaskRecord,
  OperationsTenantContext,
} from "./types";

export interface MaintenanceBoardAdapterIngestInput {
  messageId: string;
  correlationId: string;
  tenant: OperationsTenantContext;
  payload: MaintenanceBoardIngestionPayload;
}

export interface MaintenanceBoardAdapterIngestResult {
  boardTaskId: string;
  acceptedAt: string;
}

export interface MaintenanceBoardAdapter {
  ingest(
    input: MaintenanceBoardAdapterIngestInput,
  ): Promise<MaintenanceBoardAdapterIngestResult>;
  snapshot(query: MaintenanceBoardQuery): Promise<MaintenanceBoardSnapshot>;
}

const createTenantKey = (tenant: OperationsTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createBoardTaskId = (boardId: string, taskId: string): string =>
  `maintenance-task-${boardId}-${taskId}`.replace(/[^a-zA-Z0-9-]/g, "-");

export class InternalMaintenanceBoardAdapter implements MaintenanceBoardAdapter {
  private readonly recordsByTenant = new Map<string, Map<string, MaintenanceBoardTaskRecord>>();

  async ingest(
    input: MaintenanceBoardAdapterIngestInput,
  ): Promise<MaintenanceBoardAdapterIngestResult> {
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
      assetId: input.payload.task.assetId,
      roomId: input.payload.task.roomId,
      category: input.payload.task.category,
      title: input.payload.task.title,
      description: input.payload.task.description,
      status: input.payload.task.status,
      priority: input.payload.task.priority,
      assignedTo: input.payload.task.assignedTo,
      dueAt: input.payload.task.dueAt,
      metadata: input.payload.task.metadata,
      updatedAt: acceptedAt,
    });

    this.recordsByTenant.set(tenantKey, tenantRecords);

    return {
      boardTaskId,
      acceptedAt,
    };
  }

  async snapshot(query: MaintenanceBoardQuery): Promise<MaintenanceBoardSnapshot> {
    const boardId = query.boardId ?? "maintenance-main";
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
