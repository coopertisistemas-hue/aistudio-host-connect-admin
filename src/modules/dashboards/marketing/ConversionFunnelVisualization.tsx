import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConversionFunnelVisualizationProps {
  funnel: {
    impression: number;
    click: number;
    lead: number;
    reservation: number;
  };
}

const numberFormatter = new Intl.NumberFormat("pt-BR");

export const ConversionFunnelVisualization = ({
  funnel,
}: ConversionFunnelVisualizationProps) => {
  const stages = [
    { key: "impression", label: "Impression Placeholder", value: funnel.impression },
    { key: "click", label: "Clicks", value: funnel.click },
    { key: "lead", label: "Leads", value: funnel.lead },
    { key: "reservation", label: "Reservations", value: funnel.reservation },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => (
            <div key={stage.key} className="rounded-md border p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{stage.label}</p>
              <p className="mt-2 text-2xl font-semibold">{numberFormatter.format(stage.value)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
