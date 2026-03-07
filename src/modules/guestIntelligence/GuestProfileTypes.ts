import type { IntegrationEvent } from "@/integrations/hub";

export const GUEST_PROFILE_PERSISTENCE_EVENT_TYPE =
  "guest-intelligence.profile.persist.requested";

export interface GuestIntelligenceTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export type GuestSignalSource = "lead" | "reservation" | "lifecycle";

export interface GuestIdentityInput {
  externalGuestId?: string;
  leadId?: string;
  reservationId?: string;
  lifecycleEventId?: string;
}

export interface GuestContactInput {
  email?: string;
  phoneNumber?: string;
}

export interface GuestStayAggregationInput {
  totalStays?: number;
  lastStayAt?: string;
  totalRevenue?: number;
}

export interface GuestProfileSnapshotInput {
  fullName?: string;
  contact: GuestContactInput;
  language?: "pt" | "en" | "es";
  tags?: string[];
  notes?: string;
  stayAggregation?: GuestStayAggregationInput;
  metadata?: Record<string, unknown>;
}

export interface GuestProfilePersistenceFeatureFlags {
  guestProfilePersistence?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface GuestProfilePersistenceCommand {
  tenant: GuestIntelligenceTenantContext;
  correlationId?: string;
  source: GuestSignalSource;
  identity: GuestIdentityInput;
  snapshot: GuestProfileSnapshotInput;
  featureFlags?: GuestProfilePersistenceFeatureFlags;
}

export interface GuestProfilePersistencePayload {
  source: GuestSignalSource;
  identity: GuestIdentityInput;
  snapshot: GuestProfileSnapshotInput;
  capturedAt: string;
}

export type GuestProfilePersistenceEvent = IntegrationEvent<GuestProfilePersistencePayload>;

export interface GuestProfilePersistenceResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_identity";
}

export interface GuestProfileRecord {
  canonicalGuestId: string;
  orgId: string;
  primaryPropertyId?: string | null;
  propertiesSeen: string[];
  identity: {
    normalizedEmail?: string;
    normalizedPhone?: string;
    externalGuestId?: string;
    leadIds: string[];
    reservationIds: string[];
    lifecycleEventIds: string[];
    dedupStrategy: "email" | "phone" | "external_id" | "fallback";
  };
  profile: {
    fullName?: string;
    language?: "pt" | "en" | "es";
    tags: string[];
    notes?: string;
  };
  stayAggregation: {
    totalStays: number;
    lastStayAt?: string;
    totalRevenue: number;
  };
  lastSource: GuestSignalSource;
  lastCorrelationId: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface GuestProfileQuery {
  tenant: GuestIntelligenceTenantContext;
  canonicalGuestId?: string;
}

export interface GuestProfileSnapshot {
  tenant: GuestIntelligenceTenantContext;
  records: GuestProfileRecord[];
  generatedAt: string;
}
