import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueMetricsCards } from "./RevenueMetricsCards";
import {
  RevenueMetricsService,
  type RevenueDashboardData,
  type RevenueDashboardFeatureFlags,
} from "./RevenueMetricsService";
import type { AnalyticsPeriod, AnalyticsTenantContext } from "@/integrations/analytics";

interface RevenueDashboardProps {
  tenant: AnalyticsTenantContext;
  period?: AnalyticsPeriod;
  featureFlags?: RevenueDashboardFeatureFlags;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const service = new RevenueMetricsService();

export const RevenueDashboard = ({
  tenant,
  period,
  featureFlags,
}: RevenueDashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<RevenueDashboardData | null>(null);

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
    return <div className="text-sm text-muted-foreground">Loading revenue metrics...</div>;
  }

  if (error) {
    return <div className="text-sm text-destructive">Revenue dashboard unavailable: {error}</div>;
  }

  if (!dashboardData) {
    return <div className="text-sm text-muted-foreground">No revenue data available.</div>;
  }

  if (!dashboardData.enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Dashboard Disabled</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The `dashboardRevenue` feature flag is disabled for the current tenant scope.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <RevenueMetricsCards data={dashboardData} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dashboardData.revenueByProperty.length === 0 ? (
              <p className="text-muted-foreground">No property-level aggregation available.</p>
            ) : (
              dashboardData.revenueByProperty.map((item) => (
                <div key={item.propertyId} className="flex items-center justify-between">
                  <span>{item.propertyId}</span>
                  <span className="font-medium">{currencyFormatter.format(item.totalRevenue)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dashboardData.revenueByPeriod.length === 0 ? (
              <p className="text-muted-foreground">No period breakdown available.</p>
            ) : (
              dashboardData.revenueByPeriod.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span>{item.label}</span>
                  <span className="font-medium">{currencyFormatter.format(item.totalRevenue)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservations by Channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {dashboardData.reservationsByChannel.length === 0 ? (
              <p className="text-muted-foreground">No channel distribution available.</p>
            ) : (
              dashboardData.reservationsByChannel.map((item) => (
                <div key={item.channel} className="flex items-center justify-between">
                  <span>{item.channel}</span>
                  <span className="font-medium">{numberFormatter.format(item.reservationCount)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueDashboard;
