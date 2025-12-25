
import { useSupport, Ticket } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Loader2, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TicketList = () => {
    const navigate = useNavigate();
    const { useTickets } = useSupport();
    const { data: tickets, isLoading, isError } = useTickets();

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
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Meus Chamados</h1>
                        <p className="text-sm text-muted-foreground">Histórico de solicitações</p>
                    </div>
                </div>
                <Button onClick={() => navigate('/support/tickets/new')}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Chamado
                </Button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {isError && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="flex items-center gap-2 p-4 text-red-600">
                        <AlertCircle className="h-5 w-5" /> Erro ao carregar tickets. Tente novamente.
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && tickets?.length === 0 && (
                <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhum chamado encontrado</p>
                    <p className="text-sm mb-4">Você ainda não abriu nenhuma solicitação de suporte.</p>
                    <Button variant="outline" onClick={() => navigate('/support/tickets/new')}>Criar Primeiro Ticket</Button>
                </div>
            )}

            <div className="grid gap-4">
                {tickets?.map((ticket) => (
                    <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/support/tickets/${ticket.id}`)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium truncate pr-4">{ticket.title}</CardTitle>
                            <div className="flex items-center gap-2 shrink-0">
                                {getSeverityBadge(ticket.severity)}
                                {getStatusBadge(ticket.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.description}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
                                <span>Cat: {ticket.category}</span>
                                <span>{format(new Date(ticket.created_at), "d 'de' MMMM, HH:mm", { locale: ptBR })}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default TicketList;
