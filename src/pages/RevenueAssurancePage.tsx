import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { useRevenueAssurance } from "@/hooks/useRevenueAssurance";

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const RevenueAssurancePage = () => {
  const { summary, isLoading, error } = useRevenueAssurance();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Revenue Assurance</h1>
          <p className="text-muted-foreground">Carregando reconciliacao final subscription/invoice/payment...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Revenue Assurance</h1>
          <p className="text-destructive">Erro ao carregar baseline: {error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Revenue Assurance</h1>
            <p className="text-muted-foreground">
              Baseline SP18 para GO/NO-GO operacional de faturamento e integridade de receita.
            </p>
          </div>
          <Badge variant={summary.goNoGo.status === "GO" ? "default" : "destructive"}>{summary.goNoGo.status}</Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Plan</CardDescription>
              <CardTitle className="text-2xl uppercase">{summary.subscription.plan}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Subscription Status</CardDescription>
              <CardTitle className="text-2xl uppercase">{summary.subscription.effectiveStatus}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Invoiced</CardDescription>
              <CardTitle className="text-2xl">{brl(summary.totals.invoicedValue)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Paid</CardDescription>
              <CardTitle className="text-2xl">{brl(summary.totals.paidValue)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Outstanding</CardDescription>
              <CardTitle className="text-2xl">{brl(summary.totals.outstandingValue)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Matrix</CardTitle>
              <CardDescription>Sinais de fechamento subscription x invoice x payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Booked - Invoiced</span>
                <span className="font-semibold">{brl(summary.reconciliation.deltaBookedVsInvoiced)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Invoiced - Paid</span>
                <span className="font-semibold">{brl(summary.reconciliation.deltaInvoicedVsPaid)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Bookings sem invoice</span>
                <span className="font-semibold">{summary.reconciliation.bookingsWithoutInvoice}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Invoices pagas sem booking</span>
                <span className="font-semibold">{summary.reconciliation.paidInvoicesWithoutBooking}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Checkout sem invoice pago</span>
                <span className="font-semibold">{summary.reconciliation.checkedOutWithoutPaidInvoice}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GO/NO-GO Reasons</CardTitle>
              <CardDescription>Critério operacional de bloqueio/liberação de faturamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.goNoGo.status === "GO" ? (
                <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 p-3 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm">Nenhum bloqueio crítico identificado.</span>
                </div>
              ) : (
                summary.goNoGo.reasons.map((reason) => (
                  <div key={reason} className="flex items-center gap-2 rounded-md border border-destructive/30 p-3 text-destructive">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="text-sm">{reason}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leakage Signals</CardTitle>
            <CardDescription>Indicadores de perda potencial de receita no escopo atual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.leakageSignals.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 p-3 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm">Sem sinais de leakage relevantes no baseline atual.</span>
              </div>
            ) : (
              summary.leakageSignals.map((signal) => (
                <div key={signal.code} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <TriangleAlert className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium">{signal.code}</p>
                      <p className="text-xs text-muted-foreground">{signal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={signal.severity === "high" ? "destructive" : "secondary"}>{signal.severity}</Badge>
                    <Badge variant="outline">{signal.count}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RevenueAssurancePage;

