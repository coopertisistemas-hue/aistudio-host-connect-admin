import {
  InternalRevenueMetricsAdapter,
  RevenueMetricsLayer,
  type AnalyticsPeriod,
  type AnalyticsTenantContext,
  type RevenueByChannelInput,
  type RevenueByPropertyInput,
} from "@/integrations/analytics";

interface DashboardRevenueFlag {
  enabled: boolean;
  orgId?: string;
  propertyId?: string | null;
}

export interface RevenueDashboardFeatureFlags {
  dashboardRevenue?: DashboardRevenueFlag;
}

export interface RevenueDashboardQuery {
  tenant: AnalyticsTenantContext;
  period?: AnalyticsPeriod;
  featureFlags?: RevenueDashboardFeatureFlags;
}

export interface RevenueDashboardData {
  enabled: boolean;
  tenant: AnalyticsTenantContext;
  generatedAt: string;
  summary: {
    totalReservations: number;
    totalRevenue: number;
    adr: number;
    occupancySignal: number;
  };
  revenueByProperty: RevenueByPropertyInput[];
  revenueByPeriod: Array<{
    label: string;
    totalRevenue: number;
    totalReservations: number;
  }>;
  reservationsByChannel: RevenueByChannelInput[];
}

const adapter = new InternalRevenueMetricsAdapter();
const { layer } = RevenueMetricsLayer.bootstrap(adapter);

const isDashboardRevenueEnabled = (
  tenant: AnalyticsTenantContext,
  featureFlags?: RevenueDashboardFeatureFlags,
): boolean => {
  const flag = featureFlags?.dashboardRevenue;
  if (!flag) return true;
  if (!flag.enabled) return false;
  if (flag.orgId && flag.orgId !== tenant.orgId) return false;
  if (
    flag.propertyId !== undefined
    && (flag.propertyId ?? null) !== (tenant.propertyId ?? null)
  ) {
    return false;
  }

  return true;
};

const buildEmptyDashboardData = (
  tenant: AnalyticsTenantContext,
  enabled: boolean,
): RevenueDashboardData => ({
  enabled,
  tenant,
  generatedAt: new Date().toISOString(),
  summary: {
    totalReservations: 0,
    totalRevenue: 0,
    adr: 0,
    occupancySignal: 0,
  },
  revenueByProperty: [],
  revenueByPeriod: [],
  reservationsByChannel: [],
});

export class RevenueMetricsService {
  async getDashboardData(query: RevenueDashboardQuery): Promise<RevenueDashboardData> {
    const enabled = isDashboardRevenueEnabled(query.tenant, query.featureFlags);
    if (!enabled) {
      return buildEmptyDashboardData(query.tenant, false);
    }

    const snapshot = await layer.getRevenueSnapshot({
      tenant: query.tenant,
      period: query.period,
    });

    const latestRecord = snapshot.records[0];
    if (!latestRecord) {
      return buildEmptyDashboardData(query.tenant, true);
    }

    return {
      enabled: true,
      tenant: query.tenant,
      generatedAt: snapshot.generatedAt,
      summary: {
        totalReservations: latestRecord.totalReservations,
        totalRevenue: latestRecord.totalRevenue,
        adr: latestRecord.adr,
        occupancySignal: latestRecord.occupancySignal,
      },
      revenueByProperty: latestRecord.revenueByProperty ?? [],
      revenueByPeriod: latestRecord.revenueByPeriod ?? [],
      reservationsByChannel: latestRecord.reservationCountByChannel ?? [],
    };
  }
}
