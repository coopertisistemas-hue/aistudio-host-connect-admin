import type { IntegrationEvent } from "../hub";

export const TRANSACTIONAL_EMAIL_EVENT_TYPE =
  "communication.email.transactional.requested";

export type TransactionalEmailTemplate =
  | "booking_confirmation"
  | "pre_arrival_reminder"
  | "check_out_follow_up"
  | "booking_update"
  | "check_in_instructions"
  | "payment_receipt"
  | "operational_notice";

export interface TenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface TransactionalEmailCommand {
  tenant: TenantContext;
  correlationId?: string;
  template: TransactionalEmailTemplate;
  recipient: EmailRecipient;
  subject: string;
  variables: Record<string, string>;
  consent: {
    transactionalEmailAllowed: boolean;
    capturedAt: string;
    source: string;
  };
  featureFlags?: {
    transactionalEmail?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface TransactionalEmailPayload {
  template: TransactionalEmailTemplate;
  recipient: EmailRecipient;
  subject: string;
  variables: Record<string, string>;
  consent: {
    transactionalEmailAllowed: boolean;
    capturedAt: string;
    source: string;
  };
}

export type TransactionalEmailEvent = IntegrationEvent<TransactionalEmailPayload>;

export interface TransactionalEmailRequestResult {
  accepted: boolean;
  messageId?: string;
  correlationId: string;
  reason?: "feature_disabled" | "consent_missing" | "invalid_recipient";
}

export interface EmailDispatchRecord {
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  recipientEmail: string;
  template: TransactionalEmailTemplate;
  subject: string;
  status: "sent";
  sentAt: string;
  providerMessageId: string;
}
