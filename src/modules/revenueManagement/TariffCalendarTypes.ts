import type { IntegrationEvent } from "@/integrations/hub";

export const TARIFF_CALENDAR_EVENT_TYPE = "revenue.tariff.calendar.upsert.requested";

export interface RevenueTenantContext {
  orgId: string;
  propertyId?: string | null;
}

export interface TariffCalendarFeatureFlags {
  tariffCalendarBaseline?: {
    enabled: boolean;
    orgId?: string;
    propertyId?: string | null;
  };
}

export interface TariffCalendarEntryInput {
  date: string;
  baseRate: number;
  minStayNights?: number;
  maxStayNights?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  tags?: string[];
  explainability?: {
    reasonCode: string;
    details?: string;
  };
}

export interface TariffCalendarCommand {
  tenant: RevenueTenantContext;
  correlationId?: string;
  entries: TariffCalendarEntryInput[];
  featureFlags?: TariffCalendarFeatureFlags;
}

export interface TariffCalendarPayload {
  entries: TariffCalendarEntryInput[];
  capturedAt: string;
}

export type TariffCalendarEvent = IntegrationEvent<TariffCalendarPayload>;

export interface TariffCalendarRecord {
  recordId: string;
  orgId: string;
  propertyId?: string | null;
  date: string;
  baseRate: number;
  constraints: {
    minStayNights?: number;
    maxStayNights?: number;
    closedToArrival: boolean;
    closedToDeparture: boolean;
  };
  tags: string[];
  explainability: {
    reasonCode: string;
    details?: string;
  };
  advisoryOnly: true;
  correlationId: string;
  updatedAt: string;
}

export interface TariffCalendarResult {
  accepted: boolean;
  correlationId: string;
  messageId?: string;
  reason?: "feature_disabled" | "invalid_entries";
}

export interface TariffCalendarQuery {
  tenant: RevenueTenantContext;
  dateFrom?: string;
  dateTo?: string;
}

export interface TariffCalendarSnapshot {
  tenant: RevenueTenantContext;
  records: TariffCalendarRecord[];
  generatedAt: string;
}
