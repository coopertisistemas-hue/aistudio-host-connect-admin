import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
import { useSubscriptionLifecycle } from "@/hooks/useSubscriptionLifecycle";

const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const badgeVariantByStatus = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  if (status === "active") return "default";
  if (status === "trial") return "secondary";
  if (status === "grace") return "outline";
  if (status === "suspended" || status === "cancelled") return "destructive";
  return "secondary";
};

const SubscriptionLifecyclePage = () => {
  const { summary, isLoading, error } = useSubscriptionLifecycle();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Subscription Lifecycle</h1>
          <p className="text-muted-foreground">Carregando baseline de assinatura...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Subscription Lifecycle</h1>
          <p className="text-destructive">Erro ao carregar dados: {error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Lifecycle</h1>
          <p className="text-muted-foreground">
            Baseline SP16 para hardening de estados de assinatura e transicoes permitidas.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Plano</CardDescription>
              <CardTitle className="text-2xl uppercase">{summary.plan}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status Origem</CardDescription>
              <CardContent className="px-0 pb-0">
                <Badge variant={badgeVariantByStatus(summary.sourceStatus)}>{summary.sourceStatus}</Badge>
              </CardContent>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Status Efetivo</CardDescription>
              <CardContent className="px-0 pb-0">
                <Badge variant={badgeVariantByStatus(summary.effectiveStatus)}>{summary.effectiveStatus}</Badge>
              </CardContent>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Faturas Vencidas</CardDescription>
              <CardTitle className="text-2xl">{summary.overdueInvoices}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Outstanding</CardDescription>
              <CardTitle className="text-2xl">{brl(summary.outstandingValue)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transicoes Permitidas</CardTitle>
              <CardDescription>Eventos validos para o status efetivo atual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.allowedTransitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma transicao habilitada para o status atual.</p>
              ) : (
                summary.allowedTransitions.map((transition) => (
                  <div key={`${transition.event}-${transition.nextStatus}`} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{transition.event}</span>
                    </div>
                    <Badge variant="outline">{transition.nextStatus}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Guardrails Bloqueados</CardTitle>
              <CardDescription>Exemplos de transicoes invalidas bloqueadas pelo contrato.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.invalidTransitions.map((transition) => (
                <div key={`${transition.from}-${transition.event}-${transition.to}`} className="flex items-center justify-between rounded-md border border-destructive/30 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                    <span className="text-xs">{transition.from} + {transition.event}</span>
                  </div>
                  <Badge variant="destructive">{transition.to}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Operational Notes</CardTitle>
            <CardDescription>Trial, grace e suspension para operacao financeira.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              <span>
                Trial expirado sem pendencia financeira pode promover para <strong>active</strong> por regra operacional.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
              <span>
                Quando houver overdue/outstanding em assinatura ativa, status efetivo entra em <strong>grace</strong>.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 text-rose-600" />
              <span>
                Grace prolongado com risco elevado bloqueia para <strong>suspended</strong> no baseline SP16.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionLifecyclePage;

