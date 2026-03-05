import type {
  CapturedLeadRecord,
  LeadCapturePayload,
  LeadTenantContext,
} from "./types";

export interface LeadCaptureAdapterInput {
  messageId: string;
  correlationId: string;
  tenant: LeadTenantContext;
  payload: LeadCapturePayload;
}

export interface LeadCaptureAdapterResult {
  leadId: string;
  acceptedAt: string;
}

export interface LeadCaptureAdapter {
  capture(input: LeadCaptureAdapterInput): Promise<LeadCaptureAdapterResult>;
}

const createLeadId = (messageId: string) =>
  `lead-${messageId.replace(/[^a-zA-Z0-9-]/g, "-")}`;

export class InternalLeadCaptureAdapter implements LeadCaptureAdapter {
  private readonly records: CapturedLeadRecord[] = [];

  async capture(input: LeadCaptureAdapterInput): Promise<LeadCaptureAdapterResult> {
    const acceptedAt = new Date().toISOString();
    const leadId = createLeadId(input.messageId);

    this.records.push({
      leadId,
      messageId: input.messageId,
      correlationId: input.correlationId,
      orgId: input.tenant.orgId,
      propertyId: input.tenant.propertyId,
      source: input.payload.source,
      contact: input.payload.contact,
      notes: input.payload.notes,
      metadata: input.payload.metadata,
      capturedAt: acceptedAt,
    });

    return {
      leadId,
      acceptedAt,
    };
  }

  listCapturedLeads(): CapturedLeadRecord[] {
    return [...this.records];
  }
}
