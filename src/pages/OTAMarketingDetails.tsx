import React, { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Globe,
    ArrowLeft,
    History,
    ShieldCheck,
    RefreshCw,
    Link as LinkIcon,
    Hotel,
    Key,
    Database,
    Search
} from "lucide-react";
import { useMarketing } from "@/hooks/useMarketing";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRooms } from "@/hooks/useRooms";
import { useRoomTypes } from "@/hooks/useRoomTypes";

const OTAMarketingDetails = () => {
    const { provider } = useParams<{ provider: string }>();
    const { selectedPropertyId } = useSelectedProperty();
    const { connectors, syncLogs, syncNow } = useMarketing(selectedPropertyId);
    const { roomTypes } = useRoomTypes(selectedPropertyId);

    const connector = connectors.find(c => c.provider === provider);

    const providerName = provider === 'booking' ? "Booking.com" :
        provider === 'expedia' ? "Expedia Group" :
            provider === 'tripadvisor' ? "TripAdvisor" :
                provider?.toUpperCase();

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
                        <h1 className="text-3xl font-bold tracking-tight">{providerName}</h1>
                        <p className="text-muted-foreground mt-1">
                            Configuração de conectividade e mapeamento de propriedades.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="config" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
                        <TabsTrigger value="config">Configuração</TabsTrigger>
                        <TabsTrigger value="mapping">Mapeamento</TabsTrigger>
                        <TabsTrigger value="audit">Auditoria</TabsTrigger>
                    </TabsList>

                    <TabsContent value="config" className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-3">
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Key className="h-4 w-4 text-primary" />
                                        Credenciais da API
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="hotel_id">Hotel ID / Hotel Code</Label>
                                        <Input id="hotel_id" defaultValue={connector?.config?.hotel_id || ""} placeholder="EX: 123456" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="api_key">Chave de API (Opcional)</Label>
                                        <Input id="api_key" type="password" placeholder="••••••••••••••••" />
                                    </div>
                                    <Button className="w-full" variant="outline">Salvar Credenciais</Button>
                                    <p className="text-[10px] text-muted-foreground italic text-center">
                                        As credenciais são armazenadas de forma criptografada e segura.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-primary" />
                                        Estado da Conexão
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-3 w-3 rounded-full ${connector?.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                                            <div>
                                                <p className="text-sm font-bold">
                                                    {connector?.status === 'connected' ? 'Canal Ativo e Sincronizado' : 'Canal Desconectado'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {connector?.updated_at ? `Última atualização: ${format(new Date(connector.updated_at), 'Pp', { locale: ptBR })}` : 'Nenhuma atividade registrada'}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => connector && syncNow.mutate(connector.id)}>
                                            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${syncNow.isPending ? 'animate-spin' : ''}`} />
                                            Sincronizar Agora
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl border border-dashed text-center">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Disponibilidade</p>
                                            <p className="text-lg font-bold">Automático</p>
                                        </div>
                                        <div className="p-4 rounded-xl border border-dashed text-center">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Tarifas</p>
                                            <p className="text-lg font-bold">Standard</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="mapping" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    Mapeamento de Tipos de Quarto
                                </CardTitle>
                                <CardDescription>
                                    Vincule seus tipos de acomodação do HostConnect aos IDs correspondentes no {providerName}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">Tipo de Quarto (HostConnect)</th>
                                                <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">ID no {providerName}</th>
                                                <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">Status de Sync</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-xs">
                                            {roomTypes.length > 0 ? (
                                                roomTypes.map((type) => (
                                                    <tr key={type.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 font-medium">
                                                            {type.name}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Input className="h-8 max-w-[150px] text-xs" placeholder="ID da OTA" />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant="secondary" className="text-[9px] h-5">Pendente</Badge>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">
                                                        Nenhum tipo de acomodação encontrado.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <Button size="sm">Salvar Mapeamento</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="audit" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <History className="h-4 w-4 text-primary" />
                                    Log de Auditoria de Sincronização
                                </CardTitle>
                                <CardDescription>
                                    Rastreabilidade completa de comunicações entre HostConnect e {providerName}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">Data/Hora</th>
                                                <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">Evento</th>
                                                <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">Status</th>
                                                <th className="px-4 py-3 text-left font-bold text-[10px] uppercase">Detalhes</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y text-xs">
                                            {syncLogs.filter(l => l.connector_id === connector?.id).length > 0 ? (
                                                syncLogs.filter(l => l.connector_id === connector?.id).map((log) => (
                                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {format(new Date(log.started_at), 'Pp', { locale: ptBR })}
                                                        </td>
                                                        <td className="px-4 py-3 font-medium">
                                                            Sincronização de Disponibilidade
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Badge variant={log.status === 'success' ? "outline" : "destructive"} className="text-[9px] h-5">
                                                                {log.status === 'success' ? 'Sucesso' : 'Falha'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            {log.summary?.message || "Finalizado sem erros."}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                                            <Search className="h-8 w-8" />
                                                            <p className="italic">Nenhuma sincronização auditada para este canal.</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Info Box */}
                <Card className="bg-amber-50/50 border-amber-100">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <ShieldCheck className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-amber-900">Segurança da Integração</h4>
                                <p className="text-[11px] text-amber-800/80 mt-1 leading-relaxed">
                                    Para ativar a sincronização bidirecional (preços, disponibilidade e reservas), certifique-se de que o **HostConnect**
                                    esteja selecionado como seu "Channel Manager" oficial dentro do portal administrativo do {providerName}.
                                    Caso tenha dúvidas, consulte nosso manual de integrações.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default OTAMarketingDetails;
