import type { AnalyticsPeriod, AnalyticsTenantContext } from "@/integrations/analytics";
import {
  RevenueMetricsService,
  type RevenueDashboardFeatureFlags,
} from "../revenue/RevenueMetricsService";
import {
  MarketingMetricsService,
  type MarketingDashboardFeatureFlags,
} from "../marketing/MarketingMetricsService";

interface DashboardExecutiveFlag {
  enabled: boolean;
  orgId?: string;
  propertyId?: string | null;
}

export interface ExecutiveDashboardFeatureFlags {
  dashboardExecutive?: DashboardExecutiveFlag;
  revenue?: RevenueDashboardFeatureFlags;
  marketing?: MarketingDashboardFeatureFlags;
}

export interface ExecutiveMetricsQuery {
  tenant: AnalyticsTenantContext;
  period?: AnalyticsPeriod;
  featureFlags?: ExecutiveDashboardFeatureFlags;
}

export interface ExecutiveMetricsData {
  enabled: boolean;
  tenant: AnalyticsTenantContext;
  generatedAt: string;
  revenueSummary: {
    totalRevenue: number;
    totalReservations: number;
    adr: number;
  };
  campaignRoiPlaceholder: number;
  reservationTrends: Array<{
    label: string;
    reservations: number;
    revenue: number;
  }>;
  funnelConversionSummary: {
    impressions: number;
    clicks: number;
    leads: number;
    reservations: number;
    conversionRatePlaceholder: number;
  };
}

const revenueService = new RevenueMetricsService();
const marketingService = new MarketingMetricsService();

const isDashboardExecutiveEnabled = (
  tenant: AnalyticsTenantContext,
  featureFlags?: ExecutiveDashboardFeatureFlags,
): boolean => {
  const flag = featureFlags?.dashboardExecutive;
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

const buildEmptyExecutiveData = (
  tenant: AnalyticsTenantContext,
  enabled: boolean,
): ExecutiveMetricsData => ({
  enabled,
  tenant,
  generatedAt: new Date().toISOString(),
  revenueSummary: {
    totalRevenue: 0,
    totalReservations: 0,
    adr: 0,
  },
  campaignRoiPlaceholder: 0,
  reservationTrends: [],
  funnelConversionSummary: {
    impressions: 0,
    clicks: 0,
    leads: 0,
    reservations: 0,
    conversionRatePlaceholder: 0,
  },
});

export class ExecutiveMetricsService {
  async getDashboardData(query: ExecutiveMetricsQuery): Promise<ExecutiveMetricsData> {
    const enabled = isDashboardExecutiveEnabled(query.tenant, query.featureFlags);
    if (!enabled) {
      return buildEmptyExecutiveData(query.tenant, false);
    }

    const [revenueData, marketingData] = await Promise.all([
      revenueService.getDashboardData({
        tenant: query.tenant,
        period: query.period,
        featureFlags: query.featureFlags?.revenue,
      }),
      marketingService.getDashboardData({
        tenant: query.tenant,
        featureFlags: query.featureFlags?.marketing,
      }),
    ]);

    const revenueByCampaign = Object.values(marketingData.totals.revenueByCampaign).reduce(
      (accumulator, currentValue) => accumulator + currentValue,
      0,
    );

    const campaignRoiPlaceholder =
      revenueData.summary.totalRevenue > 0
        ? (revenueByCampaign / revenueData.summary.totalRevenue) * 100
        : 0;

    return {
      enabled: true,
      tenant: query.tenant,
      generatedAt: new Date().toISOString(),
      revenueSummary: {
        totalRevenue: revenueData.summary.totalRevenue,
        totalReservations: revenueData.summary.totalReservations,
        adr: revenueData.summary.adr,
      },
      campaignRoiPlaceholder,
      reservationTrends: revenueData.revenueByPeriod.map((item) => ({
        label: item.label,
        reservations: item.totalReservations,
        revenue: item.totalRevenue,
      })),
      funnelConversionSummary: {
        impressions: marketingData.funnel.impression,
        clicks: marketingData.funnel.click,
        leads: marketingData.funnel.lead,
        reservations: marketingData.funnel.reservation,
        conversionRatePlaceholder: marketingData.totals.conversionRatePlaceholder,
      },
    };
  }
}
