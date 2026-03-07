import type { IntegrationEvent } from "@/integrations/hub";
import type { DistributionTenantContext } from "./ChannelAbstractionTypes";

export const OTA_MAPPING_EVENT_TYPE = "distribution.ota.mapping.upsert.requested";

export interface OtaMappingFeatureFlags {
  otaMappingContracts?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface PropertyMappingInput {
  internalPropertyId: string;
  channelPropertyCode: string;
}

export interface RoomMappingInput {
  internalRoomTypeId: string;
  channelRoomCode: string;
}

export interface RatePlanMappingInput {
  internalRatePlanId: string;
  channelRatePlanCode: string;
}

export interface OtaMappingContractInput {
  provider: string;
  property: PropertyMappingInput;
  rooms: RoomMappingInput[];
  ratePlans: RatePlanMappingInput[];
  mappingVersion: number;
}

export interface OtaMappingCommand {
  tenant: DistributionTenantContext;
  correlationId?: string;
  mapping: OtaMappingContractInput;
  featureFlags?: OtaMappingFeatureFlags;
}

export interface OtaMappingPayload {
  mapping: OtaMappingContractInput;
  capturedAt: string;
}

export type OtaMappingEvent = IntegrationEvent<OtaMappingPayload>;

export interface OtaMappingRecord {
  recordId: string;
  orgId: string;
  propertyId?: string | null;
  provider: string;
  property: PropertyMappingInput;
  rooms: RoomMappingInput[];
  ratePlans: RatePlanMappingInput[];
  mappingVersion: number;
  deterministicHash: string;
  advisoryOnly: true;
  correlationId: string;
  updatedAt: string;
}

export interface OtaMappingResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface OtaMappingQuery {
  tenant: DistributionTenantContext;
  provider?: string;
}

export interface OtaMappingSnapshot {
  tenant: DistributionTenantContext;
  records: OtaMappingRecord[];
  generatedAt: string;
}
