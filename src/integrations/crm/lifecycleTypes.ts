import type { IntegrationEvent } from "../hub";

export const GUEST_LIFECYCLE_EVENT_TYPE = "crm.guest.lifecycle.requested";

export type LifecycleAction = "pre_arrival" | "post_stay";

export interface LifecycleTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface LifecycleRecipient {
  guestId: string;
  email?: string;
  phoneNumber?: string;
}

export interface GuestLifecycleCommand {
  tenant: LifecycleTenantContext;
  correlationId?: string;
  action: LifecycleAction;
  recipient: LifecycleRecipient;
  scheduleAt?: string;
  variables: Record<string, string>;
  consent: {
    automationAllowed: boolean;
    capturedAt: string;
    source: string;
  };
  featureFlags?: {
    lifecycleAutomation?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface GuestLifecyclePayload {
  action: LifecycleAction;
  recipient: LifecycleRecipient;
  scheduleAt?: string;
  variables: Record<string, string>;
  consent: {
    automationAllowed: boolean;
    capturedAt: string;
    source: string;
  };
}

export type GuestLifecycleEvent = IntegrationEvent<GuestLifecyclePayload>;

export interface GuestLifecycleRequestResult {
  accepted: boolean;
  messageId?: string;
  correlationId: string;
  reason?: "feature_disabled" | "consent_missing" | "invalid_recipient";
}

export interface LifecycleDispatchRecord {
  automationId: string;
  messageId: string;
  correlationId: string;
  orgId: string;
  propertyId?: string | null;
  action: LifecycleAction;
  recipient: LifecycleRecipient;
  scheduleAt?: string;
  processedAt: string;
}
