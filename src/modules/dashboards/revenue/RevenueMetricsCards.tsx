import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RevenueDashboardData } from "./RevenueMetricsService";

interface RevenueMetricsCardsProps {
  data: RevenueDashboardData;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

const metricItems = (data: RevenueDashboardData) => [
  {
    key: "total-reservations",
    title: "Total Reservations",
    value: numberFormatter.format(data.summary.totalReservations),
  },
  {
    key: "total-revenue",
    title: "Total Revenue",
    value: currencyFormatter.format(data.summary.totalRevenue),
  },
  {
    key: "adr",
    title: "ADR",
    value: currencyFormatter.format(data.summary.adr),
  },
  {
    key: "occupancy-signal",
    title: "Occupancy Signal",
    value: `${data.summary.occupancySignal.toFixed(2)}%`,
  },
];

export const RevenueMetricsCards = ({ data }: RevenueMetricsCardsProps) => (
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    {metricItems(data).map((metric) => (
      <Card key={metric.key}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{metric.value}</div>
        </CardContent>
      </Card>
    ))}
  </div>
);
