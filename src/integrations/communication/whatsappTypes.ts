import type { IntegrationEvent } from "../hub";
import type { TenantContext } from "./types";

export const TRANSACTIONAL_WHATSAPP_EVENT_TYPE =
  "communication.whatsapp.transactional.requested";

export type TransactionalWhatsAppTemplate =
  | "booking_confirmation"
  | "pre_arrival_reminder"
  | "check_out_follow_up"
  | "operational_notice";

export interface WhatsAppRecipient {
  phoneNumber: string;
  name?: string;
}

export interface TransactionalWhatsAppCommand {
  tenant: TenantContext;
  correlationId?: string;
  template: TransactionalWhatsAppTemplate;
  recipient: WhatsAppRecipient;
  messageBody: string;
  variables: Record<string, string>;
  consent: {
    transactionalWhatsAppAllowed: boolean;
    capturedAt: string;
    source: string;
  };
  featureFlags?: {
    transactionalWhatsApp?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface TransactionalWhatsAppPayload {
  template: TransactionalWhatsAppTemplate;
  recipient: WhatsAppRecipient;
  messageBody: string;
  variables: Record<string, string>;
  consent: {
    transactionalWhatsAppAllowed: boolean;
    capturedAt: string;
    source: string;
  };
}

export type TransactionalWhatsAppEvent = IntegrationEvent<TransactionalWhatsAppPayload>;

export interface TransactionalWhatsAppRequestResult {
  accepted: boolean;
  messageId?: string;
  correlationId: string;
  reason?: "feature_disabled" | "consent_missing" | "invalid_recipient";
}

export interface WhatsAppDispatchRecord {
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  destinationPhone: string;
  template: TransactionalWhatsAppTemplate;
  status: "sent";
  sentAt: string;
  providerMessageId: string;
}
