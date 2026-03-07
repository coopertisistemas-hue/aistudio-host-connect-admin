import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CampaignMetricsCardsProps {
  totals: {
    revenueByCampaign: Record<string, number>;
    reservationCountByCampaign: Record<string, number>;
    revenuePerSource: Record<string, number>;
    revenuePerMedium: Record<string, number>;
    conversionRatePlaceholder: number;
  };
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const percentFormatter = (value: number) => `${value.toFixed(2)}%`;

const sumValues = (items: Record<string, number>): number =>
  Object.values(items).reduce((accumulator, currentValue) => accumulator + currentValue, 0);

export const CampaignMetricsCards = ({ totals }: CampaignMetricsCardsProps) => {
  const cards = [
    {
      key: "revenue-by-campaign",
      title: "Revenue by Campaign",
      value: currencyFormatter.format(sumValues(totals.revenueByCampaign)),
    },
    {
      key: "revenue-by-source",
      title: "Revenue by Source",
      value: currencyFormatter.format(sumValues(totals.revenuePerSource)),
    },
    {
      key: "reservation-by-campaign",
      title: "Reservations by Campaign",
      value: sumValues(totals.reservationCountByCampaign).toString(),
    },
    {
      key: "conversion-rate",
      title: "Conversion Rate Placeholder",
      value: percentFormatter(totals.conversionRatePlaceholder),
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
