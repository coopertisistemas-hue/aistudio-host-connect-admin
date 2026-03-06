import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileWarning, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useBillingOrchestration } from "@/hooks/useBillingOrchestration";

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const BillingOrchestrationPage = () => {
  const { summary, isLoading, error } = useBillingOrchestration();

  const handleExportBillingEventsCsv = () => {
    const rows = [
      [
        "event_type",
        "invoice_id",
        "booking_id",
        "status",
        "retry_stage",
        "recovery_class",
        "idempotency_key",
        "is_duplicate",
        "amount",
        "due_date",
        "created_at",
      ],
      ...summary.billingEvents.map((event) => [
        event.eventType,
        event.invoiceId,
        event.bookingId ?? "",
        event.status,
        event.retryStage,
        event.recoveryClass,
        event.idempotencyKey,
        String(event.isDuplicate),
        String(event.amount),
        event.dueDate ?? "",
        event.createdAt,
      ]),
    ];

    const csv = rows
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `billing_orchestration_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Billing Orchestration</h1>
          <p className="text-muted-foreground">Carregando baseline de cobranca e dunning...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Billing Orchestration</h1>
          <p className="text-destructive">Erro ao carregar modulo: {error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Billing Orchestration</h1>
            <p className="text-muted-foreground">
              Baseline SP17 para idempotencia de billing, retry de dunning e recovery operacional.
            </p>
          </div>
          <Button variant="outline" onClick={handleExportBillingEventsCsv} disabled={summary.billingEvents.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Eventos CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Booked</CardDescription>
              <CardTitle className="text-2xl">{brl(summary.totals.bookedValue)}</CardTitle>
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
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Collection Rate</CardDescription>
              <CardTitle className="text-2xl">{summary.totals.collectionRate}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Idempotency Keys</CardDescription>
              <CardTitle className="text-2xl">{summary.idempotency.uniqueKeys}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Duplicated Events</CardDescription>
              <CardTitle className="text-2xl">{summary.idempotency.duplicateEvents}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Dedupe Rate</CardDescription>
              <CardTitle className="text-2xl">{summary.idempotency.dedupeRate}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Retry Queue</CardDescription>
              <CardTitle className="text-2xl">{summary.recovery.retryQueue}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dunning Pipeline</CardTitle>
              <CardDescription>Classificacao de retries por atraso de cobranca.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">D0</p>
                <p className="text-xl font-bold">{summary.dunning.d0}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">D3</p>
                <p className="text-xl font-bold">{summary.dunning.d3}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">D7</p>
                <p className="text-xl font-bold">{summary.dunning.d7}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-xs text-muted-foreground">D14+</p>
                <p className="text-xl font-bold text-destructive">{summary.dunning.d14}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Signals</CardTitle>
              <CardDescription>Diferencas de valor e riscos operacionais de settlement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Booked - Invoiced</span>
                <span className="font-semibold">{brl(summary.reconciliation.deltaBookedVsInvoiced)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Invoiced - Paid</span>
                <span className="font-semibold">{brl(summary.reconciliation.deltaInvoicedVsPaid)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm text-muted-foreground">Checkout sem invoice pago</span>
                <Badge variant="secondary">{summary.reconciliation.checkedOutWithoutPaidInvoice}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recovery Classification</CardTitle>
            <CardDescription>Classificacao de eventos para acao de recuperacao de receita.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Recoverable</p>
              <p className="text-2xl font-bold">{summary.recovery.recoverableEvents}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Terminal</p>
              <p className="text-2xl font-bold text-destructive">{summary.recovery.terminalEvents}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">No Recovery Needed</p>
              <p className="text-2xl font-bold">
                {Math.max(0, summary.billingEvents.length - summary.recovery.recoverableEvents - summary.recovery.terminalEvents)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Event Stream (Billing v2)</CardTitle>
              <CardDescription>Eventos com idempotency key e classificacao de recovery.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5" />
              {summary.billingEvents.length} eventos
            </div>
          </CardHeader>
          <CardContent>
            {summary.billingEvents.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                <FileWarning className="mx-auto mb-2 h-8 w-8 opacity-60" />
                Sem eventos de billing no escopo atual.
              </div>
            ) : (
              <div className="rounded-md border">
                <div className="grid grid-cols-8 gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-semibold">
                  <span>Evento</span>
                  <span>Status</span>
                  <span>Retry</span>
                  <span>Recovery</span>
                  <span>Dedupe</span>
                  <span>Valor</span>
                  <span>Invoice</span>
                  <span>Data</span>
                </div>
                {summary.billingEvents.slice(0, 20).map((event) => (
                  <div key={event.id} className="grid grid-cols-8 gap-2 border-b px-3 py-2 text-xs last:border-b-0">
                    <span className="font-medium">{event.eventType}</span>
                    <span>{event.status}</span>
                    <span>{event.retryStage}</span>
                    <span>{event.recoveryClass}</span>
                    <span>{event.isDuplicate ? "dup" : "ok"}</span>
                    <span>{brl(event.amount)}</span>
                    <span className="truncate">{event.invoiceId}</span>
                    <span>{format(new Date(event.createdAt), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Runbook Operacional</CardTitle>
            <CardDescription>Fluxo de resposta para recuperacao de receita.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <p className="mb-1 text-xs uppercase text-muted-foreground">Stage 1</p>
              <p className="font-medium">Recoverable (D0/D3)</p>
              <p className="text-xs text-muted-foreground">Retry e contato ativo para capturar pagamento sem bloqueio.</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="mb-1 text-xs uppercase text-muted-foreground">Stage 2</p>
              <p className="font-medium">Recoverable (D7)</p>
              <p className="text-xs text-muted-foreground">Escalar para financeiro e validar meio de pagamento alternativo.</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="mb-1 text-xs uppercase text-muted-foreground">Stage 3</p>
              <p className="font-medium">Terminal (D14+)</p>
              <p className="text-xs text-muted-foreground">Aplicar restricao comercial conforme governanca e politica de cobranca.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BillingOrchestrationPage;

