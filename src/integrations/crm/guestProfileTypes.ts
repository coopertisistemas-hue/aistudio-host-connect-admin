import type { IntegrationEvent } from "../hub";

export const GUEST_PROFILE_UPSERT_EVENT_TYPE = "crm.guest.profile.upsert.requested";

export interface GuestTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface GuestProfileContact {
  email?: string;
  phoneNumber?: string;
}

export interface GuestProfileCommand {
  tenant: GuestTenantContext;
  correlationId?: string;
  guestId: string;
  fullName?: string;
  contact: GuestProfileContact;
  language?: "pt" | "en" | "es";
  tags?: string[];
  notes?: string;
  consent: {
    profileDataAllowed: boolean;
    capturedAt: string;
    source: string;
  };
  featureFlags?: {
    guestProfile?: {
      enabled: boolean;
      orgId?: string;
      propertyId?: string | null;
    };
  };
}

export interface GuestProfilePayload {
  guestId: string;
  fullName?: string;
  contact: GuestProfileContact;
  language?: "pt" | "en" | "es";
  tags?: string[];
  notes?: string;
  consent: {
    profileDataAllowed: boolean;
    capturedAt: string;
    source: string;
  };
}

export type GuestProfileEvent = IntegrationEvent<GuestProfilePayload>;

export interface GuestProfileRequestResult {
  accepted: boolean;
  messageId?: string;
  correlationId: string;
  reason?: "feature_disabled" | "consent_missing" | "invalid_contact";
}

export interface GuestProfileRecord {
  guestId: string;
  orgId: string;
  propertyId?: string | null;
  fullName?: string;
  contact: GuestProfileContact;
  language?: "pt" | "en" | "es";
  tags: string[];
  notes?: string;
  updatedAt: string;
  correlationId: string;
}
