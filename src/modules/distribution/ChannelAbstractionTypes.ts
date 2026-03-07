import type { IntegrationEvent } from "@/integrations/hub";

export const CHANNEL_ABSTRACTION_EVENT_TYPE = "distribution.channel.abstraction.upsert.requested";

export type ChannelProvider =
  | "booking_com_placeholder"
  | "expedia_placeholder"
  | "airbnb_placeholder"
  | "direct_placeholder"
  | "other_placeholder";

export interface DistributionTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface DistributionFeatureFlags {
  distributionChannelAbstraction?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface ChannelCapabilityPlaceholder {
  availabilitySync: boolean;
  rateSync: boolean;
  reservationIngestion: boolean;
  contentSync: boolean;
}

export interface ChannelContextInput {
  provider: ChannelProvider;
  channelAccountId: string;
  channelPropertyCode?: string;
  capabilities: ChannelCapabilityPlaceholder;
  metadata?: Record<string, unknown>;
}

export interface IdempotencyKeyShape {
  orgId: string;
  propertyId?: string | null;
  provider: ChannelProvider;
  operation: string;
  externalReference?: string;
  dateScope?: string;
}

export interface ChannelAbstractionCommand {
  tenant: DistributionTenantContext;
  correlationId?: string;
  channel: ChannelContextInput;
  idempotency: IdempotencyKeyShape;
  featureFlags?: DistributionFeatureFlags;
}

export interface ChannelAbstractionPayload {
  channel: ChannelContextInput;
  idempotency: IdempotencyKeyShape;
  capturedAt: string;
}

export type ChannelAbstractionEvent = IntegrationEvent<ChannelAbstractionPayload>;

export interface ChannelAbstractionRecord {
  recordId: string;
  orgId: string;
  propertyId?: string | null;
  provider: ChannelProvider;
  channelAccountId: string;
  channelPropertyCode?: string;
  capabilities: ChannelCapabilityPlaceholder;
  idempotencyKeyTemplate: string;
  advisoryOnly: true;
  correlationId: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelAbstractionResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_payload";
}

export interface ChannelAbstractionQuery {
  tenant: DistributionTenantContext;
  provider?: ChannelProvider;
}

export interface ChannelAbstractionSnapshot {
  tenant: DistributionTenantContext;
  records: ChannelAbstractionRecord[];
  generatedAt: string;
}
