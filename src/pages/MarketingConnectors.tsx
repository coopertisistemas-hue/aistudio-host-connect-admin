import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Globe,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Clock,
    Settings2,
    Lock,
    Zap
} from "lucide-react";
import { useMarketing } from "@/hooks/useMarketing";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const MarketingConnectors = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { connectors, isLoading, connectProvider } = useMarketing(selectedPropertyId);

    const providers = [
        {
            id: "google",
            name: "Google Business Profile",
            description: "Gerencie seu perfil no Google Maps e Buscador. Sincronize fotos, posts e responda avaliações.",
            icon: <Globe className="h-10 w-10 text-blue-500" />,
            color: "blue"
        },
        {
            id: "booking",
            name: "Booking.com",
            description: "Acompanhe métricas de conversão e visibilidade no maior canal de reservas do mundo.",
            icon: <Globe className="h-10 w-10 text-blue-600" />,
            color: "blue"
        },
        {
            id: "expedia",
            name: "Expedia Group",
            description: "Integração para monitoramento de ranking e competitividade tarifária.",
            icon: <Globe className="h-10 w-10 text-yellow-600" />,
            color: "yellow"
        },
        {
            id: "tripadvisor",
            name: "Tripadvisor",
            description: "Acompanhe sua reputação e métricas de cliques para seu site direto do Tripadvisor.",
            icon: <Globe className="h-10 w-10 text-green-600" />,
            color: "green"
        }
    ];

    const handleConnect = (providerId: string) => {
        if (providerId !== 'google') {
            toast.info("A conexão com este provedor requer credenciais da API que serão configuradas em breve.");
            return;
        }

        // Mock connection for Google
        connectProvider.mutate({
            provider: providerId,
            config: {
                hotel_id: providerId === 'google' ? "L-123" : "OTA-999",
                account_name: "Mock Account"
            }
        });
    };

    return (
        <DashboardLayout>
            <div className="space-y-8 p-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Conectores de Marketing</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as integrações com canais externos e plataformas de busca.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {providers.map((p) => {
                        const isConnected = connectors.find(c => c.provider === p.id && c.status === 'connected');
                        return (
                            <Card key={p.id} className="relative overflow-hidden flex flex-col">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="p-3 rounded-xl bg-muted/50">
                                            {p.icon}
                                        </div>
                                        {isConnected ? (
                                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">
                                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                                                Conectado
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="px-3 py-1">
                                                Desconectado
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-xl">{p.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 flex flex-col">
                                    <p className="text-sm text-muted-foreground mb-6 flex-1">
                                        {p.description}
                                    </p>

                                    <div className="space-y-3">
                                        {isConnected ? (
                                            <>
                                                <div className="flex items-center justify-between text-[11px] text-muted-foreground p-2 rounded-md bg-muted/20">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Sincronizado há 2h
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Zap className="h-3 w-3 text-yellow-500" />
                                                        Auto-Sync Ativo
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1"
                                                        asChild
                                                    >
                                                        <Link to={p.id === 'google' ? "/marketing/google" : `/marketing/ota/${p.id}`}>
                                                            <Settings2 className="mr-2 h-4 w-4" />
                                                            Configurar
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive">
                                                        <Lock className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <Button
                                                className="w-full"
                                                onClick={() => handleConnect(p.id)}
                                                disabled={connectProvider.isPending}
                                            >
                                                {connectProvider.isPending && p.id === 'google' ? "Conectando..." : "Conectar Canal"}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {/* Coming Soon Card */}
                    <Card className="border-dashed border-2 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Zap className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-bold">Novos Canais</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                            Estamos desenvolvendo conexões com Meta Ads, Google Hotels e Apple Maps.
                        </p>
                    </Card>
                </div>

                {/* Security Disclosure */}
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Lock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Privacidade e Auditoria</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Todas as conexões são feitas via OAuth oficial ou chaves de API seguras.
                                    Nunca armazenamos suas senhas em texto plano. Toda sincronização de dados
                                    é registrada para auditoria no log de eventos do sistema.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default MarketingConnectors;
