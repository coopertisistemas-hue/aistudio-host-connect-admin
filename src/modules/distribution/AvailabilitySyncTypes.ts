import type { IntegrationEvent } from "@/integrations/hub";
import type { DistributionTenantContext } from "./ChannelAbstractionTypes";

export const AVAILABILITY_SYNC_EVENT_TYPE = "distribution.availability.sync.requested";

export interface AvailabilitySyncFeatureFlags {
  availabilitySyncBaseline?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface AvailabilityDeltaInput {
  internalRoomTypeId: string;
  date: string;
  availableUnits: number;
}

export interface AvailabilitySyncCommand {
  tenant: DistributionTenantContext;
  correlationId?: string;
  provider: string;
  deltas: AvailabilityDeltaInput[];
  featureFlags?: AvailabilitySyncFeatureFlags;
}

export interface AvailabilitySyncPayload {
  provider: string;
  deltas: AvailabilityDeltaInput[];
  capturedAt: string;
}

export type AvailabilitySyncEvent = IntegrationEvent<AvailabilitySyncPayload>;

export interface AvailabilitySyncRecord {
  syncId: string;
  orgId: string;
  propertyId?: string | null;
  provider: string;
  targetDate: string;
  internalRoomTypeId: string;
  mappedChannelRoomCode: string;
  availableUnits: number;
  idempotencyKey: string;
  replaySafe: true;
  advisoryOnly: true;
  correlationId: string;
  updatedAt: string;
}

export interface AvailabilitySyncResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload" | "mapping_missing";
}

export interface AvailabilitySyncQuery {
  tenant: DistributionTenantContext;
  provider?: string;
  date?: string;
}

export interface AvailabilitySyncSnapshot {
  tenant: DistributionTenantContext;
  records: AvailabilitySyncRecord[];
  generatedAt: string;
}
