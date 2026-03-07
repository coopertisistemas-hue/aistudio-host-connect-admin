import {
  CampaignMetricsLayer,
  ConversionFunnelLayer,
  InternalCampaignMetricsAdapter,
  InternalConversionFunnelAdapter,
  type AnalyticsTenantContext,
  type CampaignMetricsRecord,
  type ConversionFunnelRecord,
  type FunnelStage,
} from "@/integrations/analytics";

interface DashboardMarketingFlag {
  enabled: boolean;
  orgId?: string;
  propertyId?: string | null;
}

export interface MarketingDashboardFeatureFlags {
  dashboardMarketing?: DashboardMarketingFlag;
}

export interface MarketingMetricsQuery {
  tenant: AnalyticsTenantContext;
  featureFlags?: MarketingDashboardFeatureFlags;
}

export interface MarketingMetricsData {
  enabled: boolean;
  tenant: AnalyticsTenantContext;
  generatedAt: string;
  funnel: {
    impression: number;
    click: number;
    lead: number;
    reservation: number;
  };
  campaignMetrics: CampaignMetricsRecord[];
  totals: {
    revenueByCampaign: Record<string, number>;
    reservationCountByCampaign: Record<string, number>;
    revenuePerSource: Record<string, number>;
    revenuePerMedium: Record<string, number>;
    conversionRatePlaceholder: number;
  };
}

const conversionAdapter = new InternalConversionFunnelAdapter();
const campaignAdapter = new InternalCampaignMetricsAdapter();

const { layer: conversionLayer } = ConversionFunnelLayer.bootstrap(conversionAdapter);
const { layer: campaignLayer } = CampaignMetricsLayer.bootstrap(campaignAdapter);

const isDashboardMarketingEnabled = (
  tenant: AnalyticsTenantContext,
  featureFlags?: MarketingDashboardFeatureFlags,
): boolean => {
  const flag = featureFlags?.dashboardMarketing;
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

const buildEmptyData = (
  tenant: AnalyticsTenantContext,
  enabled: boolean,
): MarketingMetricsData => ({
  enabled,
  tenant,
  generatedAt: new Date().toISOString(),
  funnel: {
    impression: 0,
    click: 0,
    lead: 0,
    reservation: 0,
  },
  campaignMetrics: [],
  totals: {
    revenueByCampaign: {},
    reservationCountByCampaign: {},
    revenuePerSource: {},
    revenuePerMedium: {},
    conversionRatePlaceholder: 0,
  },
});

const countStage = (records: ConversionFunnelRecord[], stage: FunnelStage): number =>
  records.filter((record) => record.stages.includes(stage)).length;

const deriveConversionRate = (records: ConversionFunnelRecord[]): number => {
  const clicks = countStage(records, "click");
  const reservations = countStage(records, "reservation");
  if (clicks <= 0) return 0;
  return (reservations / clicks) * 100;
};

export class MarketingMetricsService {
  async getDashboardData(query: MarketingMetricsQuery): Promise<MarketingMetricsData> {
    const enabled = isDashboardMarketingEnabled(query.tenant, query.featureFlags);
    if (!enabled) {
      return buildEmptyData(query.tenant, false);
    }

    const [funnelSnapshot, campaignSnapshot] = await Promise.all([
      conversionLayer.getFunnelSnapshot({ tenant: query.tenant }),
      campaignLayer.getCampaignMetricsSnapshot({ tenant: query.tenant }),
    ]);

    const funnelRecords = funnelSnapshot.records;

    return {
      enabled: true,
      tenant: query.tenant,
      generatedAt: new Date().toISOString(),
      funnel: {
        impression: countStage(funnelRecords, "impression"),
        click: countStage(funnelRecords, "click"),
        lead: countStage(funnelRecords, "lead"),
        reservation: countStage(funnelRecords, "reservation"),
      },
      campaignMetrics: campaignSnapshot.records,
      totals: {
        ...campaignSnapshot.totals,
        conversionRatePlaceholder: deriveConversionRate(funnelRecords),
      },
    };
  }
}
