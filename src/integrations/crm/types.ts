import type { IntegrationEvent } from "../hub";

export const LEAD_CAPTURE_EVENT_TYPE = "crm.lead.capture.requested";

export type LeadSource = "website" | "instagram" | "whatsapp" | "campaign";

export interface LeadTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface LeadContact {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}

export interface LeadCaptureCommand {
  tenant: LeadTenantContext;
  correlationId?: string;
  source: LeadSource;
  contact: LeadContact;
  notes?: string;
  metadata?: Record<string, string>;
  consent: {
    contactAllowed: boolean;
    capturedAt: string;
    source: string;
  };
  featureFlags?: {
    leadCapture?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface LeadCapturePayload {
  source: LeadSource;
  contact: LeadContact;
  notes?: string;
  metadata?: Record<string, string>;
  consent: {
    contactAllowed: boolean;
    capturedAt: string;
    source: string;
  };
}

export type LeadCaptureEvent = IntegrationEvent<LeadCapturePayload>;

export interface LeadCaptureRequestResult {
  accepted: boolean;
  messageId?: string;
  correlationId: string;
  reason?: "feature_disabled" | "consent_missing" | "invalid_contact";
}

export interface CapturedLeadRecord {
  leadId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  source: LeadSource;
  contact: LeadContact;
  notes?: string;
  metadata?: Record<string, string>;
  capturedAt: string;
}
