import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Store, Ticket, Wallet } from "lucide-react";
import { useMarketplaceExperiences } from "@/hooks/useMarketplaceExperiences";

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MarketplaceExperiencesPage = () => {
  const { summary, isLoading, error } = useMarketplaceExperiences();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Marketplace de Experiências</h1>
          <p className="text-muted-foreground">Carregando controles de foundation...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Marketplace de Experiências</h1>
          <p className="text-destructive">Falha ao carregar dados: {error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Marketplace de Experiências</h1>
            <p className="text-muted-foreground">
              Foundation SP12 com contrato {summary.contractVersion}, controles tenant-safe e baseline de monetização.
            </p>
          </div>
          <Button asChild>
            <Link to="/services">Gerenciar Catálogo Base</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Experiências Publicáveis</CardDescription>
              <CardTitle className="text-2xl">{summary.metrics.publishedExperiences}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
              <Store className="h-4 w-4" />
              Status ativo
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Experiências em Rascunho</CardDescription>
              <CardTitle className="text-2xl">{summary.metrics.draftExperiences}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Requer ativação
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Reservas no Escopo</CardDescription>
              <CardTitle className="text-2xl">{summary.metrics.monthlyBookings}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              property_id + org_id
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Attach Revenue Estimado</CardDescription>
              <CardTitle className="text-2xl">{currency(summary.metrics.estimatedAttachRevenue)}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              baseline operacional
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Controles de Segurança e Contrato</CardTitle>
              <CardDescription>Checklist mínimo para publicação de experiências de parceiros.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.controls.map((control) => (
                <div key={control.key} className="rounded-md border p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-medium">{control.title}</p>
                    <Badge variant={control.status === "pass" ? "default" : "secondary"}>
                      {control.status === "pass" ? "PASS" : "ATENÇÃO"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{control.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catálogo Base (serviços reutilizados)</CardTitle>
              <CardDescription>
                Foundation SP12: catálogo inicial de experiências reaproveita serviços property-scoped.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.experiences.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum item cadastrado para este escopo de propriedade.</p>
              )}
              {summary.experiences.slice(0, 8).map((experience) => (
                <div key={experience.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{experience.name}</p>
                    <p className="text-xs text-muted-foreground">Status: {experience.status}</p>
                  </div>
                  <p className="text-sm font-semibold">{currency(Number(experience.price ?? 0))}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarketplaceExperiencesPage;

