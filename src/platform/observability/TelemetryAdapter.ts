import type {
  TelemetryPayload,
  TelemetryQuery,
  TelemetryRecord,
  TelemetrySnapshot,
  TelemetryTenantContext,
} from "./TelemetryTypes";

export interface TelemetryAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: TelemetryTenantContext;
  payload: TelemetryPayload;
}

export interface TelemetryAdapter {
  capture(input: TelemetryAdapterInput): Promise<void>;
  snapshot(query: TelemetryQuery): Promise<TelemetrySnapshot>;
}

const recordKey = (orgId: string, propertyId: string | null | undefined, correlationId: string, eventType: string, timestamp: string) =>
  `${orgId}:${propertyId ?? "__all"}:${correlationId}:${eventType}:${timestamp}`;

export class InMemoryTelemetryAdapter implements TelemetryAdapter {
  private readonly records = new Map<string, TelemetryRecord>();

  async capture(input: TelemetryAdapterInput): Promise<void> {
    const key = recordKey(
      input.tenant.orgId,
      input.tenant.propertyId,
      input.correlationId,
      input.payload.eventType,
      input.payload.timestamp,
    );

    this.records.set(key, {
      recordId: key,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      correlationId: input.correlationId,
      eventType: input.payload.eventType,
      severity: input.payload.severity,
      module: input.payload.module,
      message: input.payload.message,
      timestamp: input.payload.timestamp,
      metadata: input.payload.metadata,
    });
  }

  async snapshot(query: TelemetryQuery): Promise<TelemetrySnapshot> {
    const records = Array.from(this.records.values())
      .filter((record) => record.orgId === query.tenant.orgId)
      .filter((record) => !query.tenant.propertyId || record.propertyId === query.tenant.propertyId)
      .filter((record) => !query.module || record.module === query.module)
      .filter((record) => !query.severity || record.severity === query.severity)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
