import { useParams, useNavigate } from "react-router-dom";
import { useLeads, useLeadTimeline, LeadStatus } from "@/hooks/useLeads";
import { useQuotes } from "@/hooks/useQuotes";
import { EntityDetailTemplate } from "@/components/EntityDetailTemplate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Clock,
    MessageSquare,
    Calendar,
    Users,
    CheckCircle2,
    XSquare,
    FileText,
    DollarSign,
    Send,
    User,
    History
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import WinLeadDialog from "@/components/WinLeadDialog";

const LeadDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { leads, isLoading, updateLeadStatus, addTimelineNote } = useLeads(""); // Property id not needed for single find
    const { data: timeline, isLoading: loadingTimeline } = useLeadTimeline(id!);
    const { quotes, isLoading: loadingQuotes } = useQuotes(id!);

    const [noteText, setNoteText] = useState("");
    const [isWinDialogOpen, setIsWinDialogOpen] = useState(false);

    const lead = leads.find(l => l.id === id);

    if (isLoading || !lead) return null;

    const getStatusBadge = (status: LeadStatus) => {
        switch (status) {
            case 'won': return <Badge variant="success">Reservado</Badge>;
            case 'lost': return <Badge variant="destructive">Perdido</Badge>;
            case 'quoted': return <Badge className="bg-purple-500">Cotado</Badge>;
            default: return <Badge variant="secondary" className="capitalize">{status}</Badge>;
        }
    };

    const handleStatusChange = (newStatus: LeadStatus) => {
        updateLeadStatus.mutate({ id: lead.id, status: newStatus, oldStatus: lead.status });
    };

    return (
        <EntityDetailTemplate
            title={lead.guest_name}
            subtitle={`Origem: ${lead.source.toUpperCase()}`}
            statusBadge={getStatusBadge(lead.status)}
            headerActions={
                <div className="flex gap-2">
                    {lead.status !== 'won' && lead.status !== 'lost' && (
                        <>
                            <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={() => handleStatusChange('lost')}>
                                <XSquare className="h-4 w-4" /> Perdido
                            </Button>
                            <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700" onClick={() => setIsWinDialogOpen(true)}>
                                <CheckCircle2 className="h-4 w-4" /> Ganhar Reserva
                            </Button>
                        </>
                    )}
                </div>
            }
        >
            <WinLeadDialog
                open={isWinDialogOpen}
                onOpenChange={setIsWinDialogOpen}
                lead={lead}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-xl h-11">
                            <TabsTrigger value="timeline" className="flex-1 rounded-lg gap-2">
                                <History className="h-4 w-4" /> Timeline
                            </TabsTrigger>
                            <TabsTrigger value="quotes" className="flex-1 rounded-lg gap-2">
                                <DollarSign className="h-4 w-4" /> Cotações
                            </TabsTrigger>
                            <TabsTrigger value="details" className="flex-1 rounded-lg gap-2">
                                <User className="h-4 w-4" /> Dados do Hóspede
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="timeline" className="mt-6 space-y-6">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Adicionar nota interna sobre esta negociação..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    className="bg-card h-11"
                                />
                                <Button
                                    size="icon"
                                    className="h-11 w-11"
                                    onClick={() => {
                                        if (!noteText) return;
                                        addTimelineNote.mutate({ lead_id: lead.id, note: noteText });
                                        setNoteText("");
                                    }}
                                    disabled={addTimelineNote.isPending}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-0.5 before:bg-muted">
                                {timeline?.map((event) => (
                                    <div key={event.id} className="relative flex gap-4 pl-8">
                                        <div className="absolute left-0 top-1.5 h-[24px] w-[24px] rounded-full border-4 border-background bg-muted flex items-center justify-center">
                                            {event.type === 'status_change' && <Clock className="h-3 w-3 text-blue-500" />}
                                            {event.type === 'note' && <MessageSquare className="h-3 w-3 text-orange-500" />}
                                            {event.type === 'quote_sent' && <DollarSign className="h-3 w-3 text-purple-500" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                                    {event.type === 'status_change' ? 'Mudança de Status' :
                                                        event.type === 'note' ? 'Nota Interna' : 'Cotação Enviada'}
                                                </span>
                                                <span className="text-[8px] text-muted-foreground opacity-60">
                                                    {format(new Date(event.created_at), "HH:mm, dd MMM", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-sm bg-card p-3 rounded-lg border shadow-sm">
                                                {event.type === 'status_change' && (
                                                    <p>Status alterado de <span className="font-bold">{event.payload.from || '---'}</span> para <span className="font-bold text-primary">{event.payload.to}</span></p>
                                                )}
                                                {event.type === 'note' && <p>{event.payload.text}</p>}
                                                {event.type === 'quote_sent' && <p>Cotação de <span className="font-bold">R$ {event.payload.total}</span> enviada.</p>}
                                                <div className="mt-2 text-[10px] text-muted-foreground italic flex items-center gap-1">
                                                    <User className="h-3 w-3" /> {event.profiles?.full_name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="quotes" className="mt-6 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-sm">Orçamentos Gerados</h3>
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" /> Nova Cotação
                                </Button>
                            </div>

                            {quotes.length === 0 ? (
                                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed text-sm text-muted-foreground">
                                    Nenhuma cotação gerada ainda.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {quotes.map(quote => (
                                        <Card key={quote.id} className="border-none shadow-sm bg-primary/5">
                                            <CardHeader className="py-3 px-4">
                                                <div className="flex justify-between items-start">
                                                    <CardTitle className="text-sm">Total: R$ {quote.total}</CardTitle>
                                                    <Badge variant="outline" className="text-[8px] uppercase">{quote.status}</Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="px-4 pb-3 space-y-3">
                                                <div className="text-[10px] text-muted-foreground">
                                                    Expira em: {quote.expires_at ? format(new Date(quote.expires_at), "dd/MM/yyyy") : 'N/A'}
                                                </div>
                                                <Button variant="outline" size="sm" className="w-full gap-2 text-[10px] h-8" onClick={() => window.print()}>
                                                    <FileText className="h-3 w-3" /> Visualizar / Imprimir
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="details" className="mt-6">
                            <Card className="border-none shadow-sm overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="grid grid-cols-2 divide-x divide-y border-b">
                                        <div className="p-4 space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Telefone</p>
                                            <p className="text-sm font-medium">{lead.guest_phone || '---'}</p>
                                        </div>
                                        <div className="p-4 space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Email</p>
                                            <p className="text-sm font-medium truncate">{lead.guest_email || '---'}</p>
                                        </div>
                                        <div className="p-4 space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Canal</p>
                                            <p className="text-sm font-medium">{lead.channel || 'Direto'}</p>
                                        </div>
                                        <div className="p-4 space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Responsável</p>
                                            <p className="text-sm font-medium">Não Atribuído</p>
                                        </div>
                                    </div>
                                    <div className="p-4 space-y-2 bg-muted/10">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Notas Iniciais</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                                            "{lead.notes || 'Sem observações adicionais.'}"
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Calendar className="h-24 w-24 translate-x-12 -translate-y-12" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Estadia Solicitada
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Período</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-black">
                                            {lead.check_in_date ? format(new Date(lead.check_in_date), "dd/MM") : '??'}
                                        </span>
                                        <span className="text-xs opacity-70">até</span>
                                        <span className="text-xl font-black">
                                            {lead.check_out_date ? format(new Date(lead.check_out_date), "dd/MM") : '??'}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-bold">
                                    {/* To calculate days later */}
                                    ?
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-white/10">
                                <div className="space-y-1">
                                    <p className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Adultos</p>
                                    <p className="text-lg font-bold flex items-center gap-2">
                                        <Users className="h-4 w-4" /> {lead.adults}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Crianças</p>
                                    <p className="text-lg font-bold">{lead.children}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ações Rápidas</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="h-14 font-bold text-[10px] gap-2 flex-col">
                                <MessageSquare className="h-4 w-4" /> WhatsApp
                            </Button>
                            <Button variant="outline" className="h-14 font-bold text-[10px] gap-2 flex-col">
                                <DollarSign className="h-4 w-4" /> Orçamento
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </EntityDetailTemplate>
    );
};

export default LeadDetailPage;
