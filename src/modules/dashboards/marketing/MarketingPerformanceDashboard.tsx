import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConversionFunnelVisualization } from "./ConversionFunnelVisualization";
import { CampaignMetricsCards } from "./CampaignMetricsCards";
import {
  MarketingMetricsService,
  type MarketingDashboardFeatureFlags,
  type MarketingMetricsData,
} from "./MarketingMetricsService";
import type { AnalyticsTenantContext } from "@/integrations/analytics";

interface MarketingPerformanceDashboardProps {
  tenant: AnalyticsTenantContext;
  featureFlags?: MarketingDashboardFeatureFlags;
}

const service = new MarketingMetricsService();

export const MarketingPerformanceDashboard = ({
  tenant,
  featureFlags,
}: MarketingPerformanceDashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<MarketingMetricsData | null>(null);

  const query = useMemo(() => ({ tenant, featureFlags }), [tenant, featureFlags]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await service.getDashboardData(query);
        if (isMounted) {
          setDashboardData(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "unknown_error");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [query]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading marketing metrics...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">Marketing dashboard unavailable: {error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-sm text-muted-foreground">No marketing metrics available.</div>;
  }

  if (!dashboardData.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marketing Dashboard Disabled</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The `dashboardMarketing` feature flag is disabled for the current tenant scope.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CampaignMetricsCards totals={dashboardData.totals} />
      <ConversionFunnelVisualization funnel={dashboardData.funnel} />

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Medium</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.entries(dashboardData.totals.revenuePerMedium).length === 0 ? (
            <p className="text-muted-foreground">No medium-level revenue aggregation available.</p>
          ) : (
            Object.entries(dashboardData.totals.revenuePerMedium).map(([medium, value]) => (
              <div key={medium} className="flex items-center justify-between">
                <span>{medium}</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 2,
                  }).format(value)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingPerformanceDashboard;
