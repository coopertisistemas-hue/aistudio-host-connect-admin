import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, LineChart, ShieldAlert, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { useMonetizationConsole } from "@/hooks/useMonetizationConsole";

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MonetizationConsolePage = () => {
  const { summary, isLoading, error } = useMonetizationConsole();

  const handleExportCsv = () => {
    const rows: Array<Array<string>> = [
      ["section", "metric", "value"],
      ["kpi", "mrr_baseline", String(summary.kpis.mrrBaseline)],
      ["kpi", "invoiced_value", String(summary.kpis.invoicedValue)],
      ["kpi", "paid_value", String(summary.kpis.paidValue)],
      ["kpi", "outstanding_value", String(summary.kpis.outstandingValue)],
      ["kpi", "delinquency_rate_pct", String(summary.kpis.delinquencyRate)],
      ["risk", "overdue_invoices", String(summary.risk.overdueInvoices)],
      ["risk", "trial_days_remaining", String(summary.risk.trialDaysRemaining ?? "")],
      ["risk", "churn_risk_score", String(summary.risk.churnRiskScore)],
      ["opportunity", "active_properties", String(summary.opportunity.activeProperties)],
      ["opportunity", "accommodation_limit", String(summary.opportunity.accommodationLimit)],
      ["opportunity", "occupancy_limit_ratio_pct", String(summary.opportunity.occupancyLimitRatio)],
      ["opportunity", "upgrade_recommended", String(summary.opportunity.upgradeRecommended)],
    ];

    summary.planMix.forEach((item) => {
      rows.push(["plan_mix", item.plan, String(item.count)]);
    });
    summary.billingTimeline.forEach((item) => {
      rows.push(["timeline_paid", item.month, String(item.paid)]);
      rows.push(["timeline_invoiced", item.month, String(item.invoiced)]);
    });

    const csv = rows
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `monetization_console_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Monetization Console</h1>
          <p className="text-muted-foreground">Carregando indicadores de receita e risco...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Monetization Console</h1>
          <p className="text-destructive">Erro ao carregar dados: {error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Monetization Console</h1>
            <p className="text-muted-foreground">
              Baseline SP15 para MRR, inadimplencia, risco de churn e oportunidades de upgrade.
            </p>
          </div>
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>MRR Baseline</CardDescription>
              <CardTitle className="text-2xl">{brl(summary.kpis.mrrBaseline)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Invoiced</CardDescription>
              <CardTitle className="text-2xl">{brl(summary.kpis.invoicedValue)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid</CardDescription>
              <CardTitle className="text-2xl">{brl(summary.kpis.paidValue)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Outstanding</CardDescription>
              <CardTitle className="text-2xl">{brl(summary.kpis.outstandingValue)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Delinquency</CardDescription>
              <CardTitle className="text-2xl">{summary.kpis.delinquencyRate}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Billing Timeline (6 meses)</CardTitle>
              <CardDescription>Comparativo mensal entre valor faturado e valor pago.</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.billingTimeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados de timeline no escopo atual.</p>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-3 gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-semibold">
                    <span>Mes</span>
                    <span>Paid</span>
                    <span>Invoiced</span>
                  </div>
                  {summary.billingTimeline.map((item) => (
                    <div key={item.month} className="grid grid-cols-3 gap-2 border-b px-3 py-2 text-xs last:border-b-0">
                      <span>{item.month}</span>
                      <span>{brl(item.paid)}</span>
                      <span>{brl(item.invoiced)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Risk</CardTitle>
              <CardDescription>Sinais de risco para retencao e cobranca.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm">Faturas vencidas</span>
                </div>
                <Badge variant="secondary">{summary.risk.overdueInvoices}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" />
                  <span className="text-sm">Churn Risk Score</span>
                </div>
                <Badge variant="secondary">{summary.risk.churnRiskScore}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-sky-600" />
                  <span className="text-sm">Trial restante</span>
                </div>
                <Badge variant="secondary">
                  {summary.risk.trialDaysRemaining === null ? "N/A" : `${summary.risk.trialDaysRemaining}d`}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Plan Mix</CardTitle>
              <CardDescription>Distribuicao de planos no escopo da organizacao.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.planMix.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados de plano para exibir.</p>
              ) : (
                summary.planMix.map((item) => (
                  <div key={item.plan} className="flex items-center justify-between rounded-md border p-3">
                    <span className="text-sm font-medium uppercase">{item.plan}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upgrade Opportunities</CardTitle>
              <CardDescription>Baseline de expansao de receita por capacidade/uso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Propriedades ativas</span>
                <span className="font-semibold">{summary.opportunity.activeProperties}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Limite de acomodacoes</span>
                <span className="font-semibold">{summary.opportunity.accommodationLimit}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Uso do limite</span>
                <span className="font-semibold">{summary.opportunity.occupancyLimitRatio}%</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">Upgrade recomendado</span>
                </div>
                <Badge variant={summary.opportunity.upgradeRecommended ? "default" : "secondary"}>
                  {summary.opportunity.upgradeRecommended ? "SIM" : "NAO"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MonetizationConsolePage;

