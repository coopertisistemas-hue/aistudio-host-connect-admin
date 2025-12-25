
import { useSupport, Ticket } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, LifeBuoy, AlertCircle, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AdminTicketList = () => {
    const navigate = useNavigate();
    const { useTickets } = useSupport();
    const { data: tickets, isLoading, isError } = useTickets();
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const filteredTickets = tickets?.filter(t => statusFilter === 'all' || t.status === statusFilter);

    const getStatusBadge = (status: Ticket['status']) => {
        switch (status) {
            case 'open': return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Aberto</Badge>;
            case 'in_progress': return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Em Análise</Badge>;
            case 'resolved': return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Resolvido</Badge>;
            case 'closed': return <Badge variant="secondary">Fechado</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getSeverityBadge = (severity: Ticket['severity']) => {
        switch (severity) {
            case 'critical': return <Badge className="bg-red-600 hover:bg-red-700">Crítico</Badge>;
            case 'high': return <Badge className="bg-orange-500 hover:bg-orange-600">Alto</Badge>;
            case 'medium': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Médio</Badge>;
            case 'low': return <Badge variant="outline" className="text-muted-foreground border-dashed">Baixo</Badge>;
            default: return null;
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Chamados</h1>
                        <p className="text-sm text-slate-500">Painel Administrativo</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="open">Aberto</SelectItem>
                            <SelectItem value="in_progress">Em Análise</SelectItem>
                            <SelectItem value="resolved">Resolvido</SelectItem>
                            <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {isError && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-2 p-4 text-red-600">
                        <AlertCircle className="h-5 w-5" /> Erro ao carregar tickets.
                    </CardContent>
                </Card>
            )}

            <div className="rounded-md border bg-white">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-slate-50 font-medium text-sm text-slate-500">
                    <div className="col-span-5">Assunto / ID</div>
                    <div className="col-span-2">Categoria</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-center">Severidade</div>
                    <div className="col-span-1 text-right">Data</div>
                </div>

                {filteredTickets?.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">Nenhum ticket encontrado.</div>
                ) : (
                    filteredTickets?.map((ticket) => (
                        <div
                            key={ticket.id}
                            className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 hover:bg-slate-50 cursor-pointer items-center transition-colors"
                            onClick={() => navigate(`/support/admin/tickets/${ticket.id}`)}
                        >
                            <div className="col-span-5">
                                <div className="font-medium text-slate-900 truncate">{ticket.title}</div>
                                <div className="text-xs text-slate-400 font-mono">{ticket.id}</div>
                            </div>
                            <div className="col-span-2">
                                <Badge variant="secondary" className="capitalize font-normal text-slate-600">{ticket.category}</Badge>
                            </div>
                            <div className="col-span-2 text-center">
                                {getStatusBadge(ticket.status)}
                            </div>
                            <div className="col-span-2 text-center">
                                {getSeverityBadge(ticket.severity)}
                            </div>
                            <div className="col-span-1 text-right text-xs text-slate-500">
                                {format(new Date(ticket.created_at), "dd/MM")}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminTicketList;
