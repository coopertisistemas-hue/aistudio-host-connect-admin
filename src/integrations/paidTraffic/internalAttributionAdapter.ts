import type {
  AttributionOutcomeLinkPayload,
  AttributionQuery,
  AttributionRecord,
  AttributionSnapshot,
  AttributionTouchpointPayload,
  PaidTrafficTenantContext,
} from "./types";

export interface AttributionAdapterRecordInput {
  messageId: string;
  correlationId: string;
  tenant: PaidTrafficTenantContext;
  payload: AttributionTouchpointPayload;
}

export interface AttributionAdapterRecordResult {
  touchpointId: string;
  acceptedAt: string;
}

export interface AttributionAdapterLinkInput {
  messageId: string;
  correlationId: string;
  tenant: PaidTrafficTenantContext;
  payload: AttributionOutcomeLinkPayload;
}

export interface AttributionAdapterLinkResult {
  touchpointId: string;
  linkedAt: string;
}

export interface AttributionAdapter {
  recordTouchpoint(
    input: AttributionAdapterRecordInput,
  ): Promise<AttributionAdapterRecordResult>;
  linkOutcome(input: AttributionAdapterLinkInput): Promise<AttributionAdapterLinkResult | null>;
  snapshot(query: AttributionQuery): Promise<AttributionSnapshot>;
}

const createTenantKey = (tenant: PaidTrafficTenantContext): string =>
  `${tenant.orgId}::${tenant.propertyId ?? "__all_properties__"}`;

const createTouchpointId = (
  campaign: string,
  source: string,
  medium: string,
  clickIdentifier: string | undefined,
  occurredAt: string,
): string =>
  `attr-${campaign}-${source}-${medium}-${clickIdentifier ?? "no-click"}-${occurredAt}`.replace(
    /[^a-zA-Z0-9-]/g,
    "-",
  );

const deriveState = (record: AttributionRecord): AttributionRecord["state"] => {
  if (record.linkedLeadId && record.linkedReservationId) return "linked_to_both";
  if (record.linkedReservationId) return "linked_to_reservation";
  if (record.linkedLeadId) return "linked_to_lead";
  return "touchpoint_recorded";
};

export class InternalAttributionAdapter implements AttributionAdapter {
  private readonly recordsByTenant = new Map<string, Map<string, AttributionRecord>>();

  async recordTouchpoint(
    input: AttributionAdapterRecordInput,
  ): Promise<AttributionAdapterRecordResult> {
    const tenantKey = createTenantKey(input.tenant);
    const touchpoint = input.payload.touchpoint;
    const touchpointId = createTouchpointId(
      touchpoint.campaign,
      touchpoint.source,
      touchpoint.medium,
      touchpoint.clickIdentifier,
      touchpoint.occurredAt,
    );
    const acceptedAt = new Date().toISOString();

    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();
    const record: AttributionRecord = {
      touchpointId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      model: input.payload.model,
      campaign: touchpoint.campaign,
      source: touchpoint.source,
      medium: touchpoint.medium,
      clickIdentifier: touchpoint.clickIdentifier,
      landingPath: touchpoint.landingPath,
      occurredAt: touchpoint.occurredAt,
      leadIdPlaceholder: touchpoint.leadIdPlaceholder,
      reservationIdPlaceholder: touchpoint.reservationIdPlaceholder,
      metadata: touchpoint.metadata,
      state: "touchpoint_recorded",
      updatedAt: acceptedAt,
    };

    tenantRecords.set(touchpointId, record);
    this.recordsByTenant.set(tenantKey, tenantRecords);

    return {
      touchpointId,
      acceptedAt,
    };
  }

  async linkOutcome(input: AttributionAdapterLinkInput): Promise<AttributionAdapterLinkResult | null> {
    const tenantKey = createTenantKey(input.tenant);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();
    const outcome = input.payload.outcome;

    const matchedRecord = outcome.touchpointId
      ? tenantRecords.get(outcome.touchpointId)
      : Array.from(tenantRecords.values()).find(
          (record) =>
            outcome.clickIdentifier !== undefined &&
            record.clickIdentifier === outcome.clickIdentifier,
        );

    if (!matchedRecord) return null;

    if (outcome.leadId) matchedRecord.linkedLeadId = outcome.leadId;
    if (outcome.reservationId) matchedRecord.linkedReservationId = outcome.reservationId;

    matchedRecord.updatedAt = new Date().toISOString();
    matchedRecord.state = deriveState(matchedRecord);
    matchedRecord.metadata = {
      ...(matchedRecord.metadata ?? {}),
      ...(outcome.metadata ?? {}),
    };

    tenantRecords.set(matchedRecord.touchpointId, matchedRecord);
    this.recordsByTenant.set(tenantKey, tenantRecords);

    return {
      touchpointId: matchedRecord.touchpointId,
      linkedAt: outcome.linkedAt,
    };
  }

  async snapshot(query: AttributionQuery): Promise<AttributionSnapshot> {
    const tenantKey = createTenantKey(query.tenant);
    const tenantRecords = this.recordsByTenant.get(tenantKey) ?? new Map();

    const records = Array.from(tenantRecords.values())
      .filter((record) => !query.campaign || record.campaign === query.campaign)
      .filter((record) => !query.source || record.source === query.source)
      .filter((record) => !query.medium || record.medium === query.medium)
      .filter(
        (record) =>
          !query.leadId ||
          record.linkedLeadId === query.leadId ||
          record.leadIdPlaceholder === query.leadId,
      )
      .filter(
        (record) =>
          !query.reservationId ||
          record.linkedReservationId === query.reservationId ||
          record.reservationIdPlaceholder === query.reservationId,
      )
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    return {
      tenant: query.tenant,
      records,
      generatedAt: new Date().toISOString(),
    };
  }
}
