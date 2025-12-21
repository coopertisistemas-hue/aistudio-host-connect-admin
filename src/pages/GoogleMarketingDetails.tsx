import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Globe,
    ArrowLeft,
    Search,
    MapPin,
    TrendingUp,
    BarChart,
    Calendar,
    History,
    ShieldCheck,
    RefreshCw
} from "lucide-react";
import { useMarketing } from "@/hooks/useMarketing";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const GoogleMarketingDetails = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { connectors, syncLogs, isLoading, syncNow } = useMarketing(selectedPropertyId);

    const googleConnector = connectors.find(c => c.provider === 'google');

    return (
        <DashboardLayout>
            <div className="space-y-8 p-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link to="/marketing/connectors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Google Business Profile</h1>
                        <p className="text-muted-foreground mt-1">
                            Configurações e auditoria de sincronização.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Configuration Card */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Configurar Conexão
                            </CardTitle>
                            <CardDescription>Identificadores da sua localização no Google.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="location_id">Location ID</Label>
                                <Input
                                    id="location_id"
                                    defaultValue={googleConnector?.config?.location_id || ""}
                                    placeholder="EX: accounts/123/locations/456"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_name">Nome da Conta</Label>
                                <Input
                                    id="account_name"
                                    defaultValue={googleConnector?.config?.account_name || ""}
                                    placeholder="Nome do perfil no Google"
                                />
                            </div>
                            <Button className="w-full" variant="outline">Salvar Configurações</Button>

                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold uppercase text-muted-foreground">Estado</span>
                                    <Badge variant={googleConnector?.status === 'connected' ? "outline" : "secondary"}>
                                        {googleConnector?.status === 'connected' ? 'Serviço Ativo' : 'Pendente'}
                                    </Badge>
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={() => googleConnector && syncNow.mutate(googleConnector.id)}
                                    disabled={syncNow.isPending || !googleConnector}
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${syncNow.isPending ? 'animate-spin' : ''}`} />
                                    {syncNow.isPending ? "Sincronizando..." : "Sincronizar Manualmente"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sync History & Audit */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Histórico de Sincronização
                            </CardTitle>
                            <CardDescription>Registro auditável das últimas coletas de dados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">Data/Hora</th>
                                            <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">Status</th>
                                            <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">Resumo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {syncLogs.length > 0 ? (
                                            syncLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                        {format(new Date(log.started_at), 'Pp', { locale: ptBR })}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant={log.status === 'success' ? "outline" : "destructive"} className="text-[10px] h-5">
                                                            {log.status === 'success' ? 'Sucesso' : 'Falha'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                                        {log.summary?.message || "Finalizado sem erros."}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">
                                                    Nenhum registro de sincronização encontrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Info Box */}
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <Globe className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-blue-900">Sobre os dados do Google</h4>
                                <p className="text-xs text-blue-800/80 mt-1 leading-relaxed">
                                    Os dados provenientes do Google Business Profile (Impressões, Cliques, etc.) são atualizados com um atraso de até
                                    48 horas pela própria plataforma do Google. O HostConnect sincroniza esses dados automaticamente uma vez por dia
                                    para garantir que seus dashboards estejam sempre atualizados com a informação mais recente disponível.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default GoogleMarketingDetails;
