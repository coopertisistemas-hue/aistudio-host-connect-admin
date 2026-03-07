import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExecutiveMetricsService,
  type ExecutiveDashboardFeatureFlags,
  type ExecutiveMetricsData,
} from "./ExecutiveMetricsService";
import { ExecutiveMetricsSummary } from "./ExecutiveMetricsSummary";
import type { AnalyticsPeriod, AnalyticsTenantContext } from "@/integrations/analytics";

interface ExecutiveOverviewDashboardProps {
  tenant: AnalyticsTenantContext;
  period?: AnalyticsPeriod;
  featureFlags?: ExecutiveDashboardFeatureFlags;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const service = new ExecutiveMetricsService();

export const ExecutiveOverviewDashboard = ({
  tenant,
  period,
  featureFlags,
}: ExecutiveOverviewDashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<ExecutiveMetricsData | null>(null);

  const query = useMemo(
    () => ({ tenant, period, featureFlags }),
    [tenant, period, featureFlags],
  );

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
    return <div className="text-sm text-muted-foreground">Loading executive overview...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">Executive dashboard unavailable: {error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-sm text-muted-foreground">No executive metrics available.</div>;
  }

  if (!dashboardData.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Executive Dashboard Disabled</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The `dashboardExecutive` feature flag is disabled for the current tenant scope.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ExecutiveMetricsSummary data={dashboardData} />

      <Card>
        <CardHeader>
          <CardTitle>Reservation Trend Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {dashboardData.reservationTrends.length === 0 ? (
            <p className="text-muted-foreground">No reservation trend data available.</p>
          ) : (
            dashboardData.reservationTrends.map((trend) => (
              <div key={trend.label} className="flex items-center justify-between">
                <span>{trend.label}</span>
                <span className="font-medium">
                  {trend.reservations} reservations / {currencyFormatter.format(trend.revenue)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveOverviewDashboard;
