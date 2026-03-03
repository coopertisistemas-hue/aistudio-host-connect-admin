import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Building2, DollarSign, Hotel, LineChart } from "lucide-react";
import { useExecutiveConsolidation } from "@/hooks/useExecutiveConsolidation";

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ExecutiveConsolidationPage = () => {
  const { summary, isLoading, error } = useExecutiveConsolidation();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Consolidação Executiva</h1>
          <p className="text-muted-foreground">Carregando baseline consolidado multi-propriedade...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Consolidação Executiva</h1>
          <p className="text-destructive">Falha ao carregar dados consolidados: {error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Consolidação Executiva</h1>
          <p className="text-muted-foreground">
            Baseline de visão consolidada por organização (receita, custos, risco e performance por propriedade).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Propriedades Ativas</CardDescription>
              <CardTitle className="text-2xl">{summary.totals.activeProperties}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Escopo organizacional
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Receita Bruta Consolidada</CardDescription>
              <CardTitle className="text-2xl">{currency(summary.totals.grossRevenue)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Reservas não canceladas
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Resultado Líquido</CardDescription>
              <CardTitle className="text-2xl">{currency(summary.totals.netResult)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Receita - despesas
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ocupação Consolidada</CardDescription>
              <CardTitle className="text-2xl">{summary.totals.occupancyRate}%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
              <Hotel className="h-4 w-4" />
              Estimativa mensal
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Propriedades por Receita</CardTitle>
              <CardDescription>Consolidação multi-propriedade para tomada de decisão executiva.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.topProperties.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem dados suficientes para ranking consolidado.</p>
              )}
              {summary.topProperties.map((property) => (
                <div key={property.propertyId} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{property.propertyName}</p>
                    <p className="text-xs text-muted-foreground">{property.bookings} reservas no período</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{currency(property.revenue)}</p>
                    <p className="text-xs text-muted-foreground">Líquido: {currency(property.net)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riscos Operacionais</CardTitle>
              <CardDescription>Sinais de atenção para rede/propriedade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm">Propriedades sem reservas</span>
                </div>
                <Badge variant="secondary">{summary.risk.propertiesWithoutBookings}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  <span className="text-sm">Despesas vencidas</span>
                </div>
                <Badge variant="secondary">{summary.risk.overdueExpenses}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Baseline SP12: consolidado executivo auditável para governança da rede.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExecutiveConsolidationPage;

