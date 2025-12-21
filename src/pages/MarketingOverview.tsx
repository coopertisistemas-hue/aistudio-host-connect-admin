import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BarChart3,
    TrendingUp,
    MousePointer2,
    PhoneCall,
    MapPin,
    Globe,
    Download,
    AlertCircle,
    RefreshCw
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area
} from "recharts";
import { useMarketing } from "@/hooks/useMarketing";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const MarketingOverview = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { metrics, connectors, isLoading, syncNow } = useMarketing(selectedPropertyId);

    const stats = [
        {
            title: "Impressões",
            value: metrics.reduce((acc, m) => acc + m.impressions, 0),
            icon: TrendingUp,
            color: "text-blue-500",
            description: "Visualizações totais na busca e mapas"
        },
        {
            title: "Cliques",
            value: metrics.reduce((acc, m) => acc + m.clicks, 0),
            icon: MousePointer2,
            color: "text-green-500",
            description: "Cliques para o site ou detalhes"
        },
        {
            title: "Chamadas",
            value: metrics.reduce((acc, m) => acc + m.calls, 0),
            icon: PhoneCall,
            color: "text-purple-500",
            description: "Ligações iniciadas via perfil"
        },
        {
            title: "Rotas",
            value: metrics.reduce((acc, m) => acc + m.direction_requests, 0),
            icon: MapPin,
            color: "text-orange-500",
            description: "Solicitações de direções"
        }
    ];

    if (connectors.length === 0 && !isLoading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                    <div className="bg-primary/10 p-6 rounded-full mb-6">
                        <Globe className="h-12 w-12 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Módulo de Marketing</h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                        Conecte suas contas do Google Business Profile e outras redes para começar a centralizar suas métricas de visibilidade.
                    </p>
                    <Button asChild size="lg">
                        <a href="/marketing/connectors">Configurar Conectores</a>
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Marketing Overview</h1>
                        <p className="text-muted-foreground mt-1">
                            Desempenho de visibilidade e canais de aquisição.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Exportar PDF
                        </Button>
                        <Button size="sm">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sincronizar Agora
                        </Button>
                    </div>
                </div>

                {/* Status Alert if some connector has error */}
                {connectors.some(c => c.status === 'error') && (
                    <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-3 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        <p className="text-sm font-medium">Um ou mais conectores apresentam erro de autenticação. Verifique as configurações.</p>
                    </div>
                )}

                {/* Global KPIs */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => (
                        <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isLoading ? "..." : stat.value.toLocaleString('pt-BR')}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Main Trend Chart */}
                    <Card className="col-span-full lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Tendência de Visibilidade</CardTitle>
                            <CardDescription>Impressões e Cliques nos últimos 30 dias</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={metrics}>
                                        <defs>
                                            <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="metric_date"
                                            tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            labelFormatter={(label) => format(new Date(label), 'PPP', { locale: ptBR })}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="impressions"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#colorImp)"
                                            name="Impressões"
                                        />
                                        <Line type="monotone" dataKey="clicks" stroke="#10b981" dot={false} name="Cliques" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Conversions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversões Diretas</CardTitle>
                            <CardDescription>Ações realizadas pelos clientes via Google</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="metric_date"
                                            tickFormatter={(date) => format(new Date(date), 'dd/MM')}
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            labelFormatter={(label) => format(new Date(label), 'PPP', { locale: ptBR })}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="calls" fill="#a855f7" radius={[2, 2, 0, 0]} name="Chamadas" />
                                        <Bar dataKey="direction_requests" fill="#f97316" radius={[2, 2, 0, 0]} name="Rotas" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Connectors Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Conectores de Canais</CardTitle>
                            <CardDescription>Estado das integrações de marketing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {['google', 'booking', 'expedia', 'tripadvisor'].map((provider) => {
                                    const conn = connectors.find(c => c.provider === provider);
                                    return (
                                        <div key={provider} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded bg-background flex items-center justify-center shadow-sm">
                                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold capitalize">{provider}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {conn ? `Última sincronização: ${format(new Date(conn.updated_at), 'Pp', { locale: ptBR })}` : 'Não conectado'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={conn?.status === 'connected' ? "outline" : "secondary"}>
                                                {conn?.status === 'connected' ? 'Ativo' : 'Offline'}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default MarketingOverview;
