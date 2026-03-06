import type { IntegrationEvent } from "../hub";

export const FNRH_INTEGRATION_EVENT_TYPE = "compliance.fnrh.submission.requested";

export type FnrhLifecycleStage = "pre_checkin" | "checkin" | "checkout";

export interface FnrhTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface FnrhReservationInput {
  reservationId: string;
  externalReservationId?: string | null;
  checkInDate: string;
  checkOutDate: string;
}

export interface FnrhPropertyInput {
  establishmentCode?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface FnrhGuestDocumentInput {
  type?: "CPF" | "PASSAPORTE" | "RNE" | "OUTRO";
  number: string;
}

export interface FnrhGuestInput {
  fullName: string;
  document: FnrhGuestDocumentInput;
  birthDate?: string;
  email?: string;
  phone?: string;
  nationality?: string;
}

export interface FnrhIntegrationCommand {
  tenant: FnrhTenantContext;
  correlationId?: string;
  lifecycleStage: FnrhLifecycleStage;
  reservation: FnrhReservationInput;
  property: FnrhPropertyInput;
  guest: FnrhGuestInput;
  featureFlags?: {
    fnrhIntegration?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface FnrhSubmissionPayload {
  lifecycleStage: FnrhLifecycleStage;
  reservation: FnrhReservationInput;
  property: FnrhPropertyInput;
  guest: FnrhGuestInput;
  requestedAt: string;
}

export type FnrhIntegrationEvent = IntegrationEvent<FnrhSubmissionPayload>;

export interface FnrhIntegrationResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface FnrhValidationIssue {
  field: string;
  code: string;
  message: string;
  severity: "BLOCK" | "WARN" | "INFO";
}

export interface FnrhPreparedSubmissionRecord {
  submissionId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  lifecycleStage: FnrhLifecycleStage;
  payloadHash: string;
  dadosFicha: Record<string, unknown>;
  issues: FnrhValidationIssue[];
  status: "prepared" | "invalid";
  preparedAt: string;
}

export interface FnrhSubmissionQuery {
  tenant: FnrhTenantContext;
  lifecycleStage?: FnrhLifecycleStage;
  status?: "prepared" | "invalid";
  limit?: number;
}

export interface FnrhMonitoringSnapshot {
  tenant: FnrhTenantContext;
  totals: {
    prepared: number;
    invalid: number;
    processing: number;
    failed: number;
    deadLetter: number;
  };
  lifecycleBreakdown: Record<FnrhLifecycleStage, number>;
  validationSeverityBreakdown: Record<"BLOCK" | "WARN" | "INFO", number>;
  recentInvalidSubmissions: Pick<
    FnrhPreparedSubmissionRecord,
    "submissionId" | "correlationId" | "lifecycleStage" | "preparedAt" | "issues"
  >[];
  generatedAt: string;
}
