import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExecutiveMetricsData } from "./ExecutiveMetricsService";

interface ExecutiveMetricsSummaryProps {
  data: ExecutiveMetricsData;
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR");

export const ExecutiveMetricsSummary = ({ data }: ExecutiveMetricsSummaryProps) => {
  const cards = [
    {
      key: "revenue-summary",
      title: "Revenue Summary",
      value: currencyFormatter.format(data.revenueSummary.totalRevenue),
    },
    {
      key: "reservation-summary",
      title: "Reservation Trends",
      value: numberFormatter.format(data.revenueSummary.totalReservations),
    },
    {
      key: "campaign-roi",
      title: "Campaign ROI Placeholder",
      value: `${data.campaignRoiPlaceholder.toFixed(2)}%`,
    },
    {
      key: "funnel-conversion",
      title: "Funnel Conversion Summary",
      value: `${data.funnelConversionSummary.conversionRatePlaceholder.toFixed(2)}%`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
