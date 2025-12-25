
import { useSupport, Ticket } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, User, ShieldCheck, Clock } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { useTicket, useTicketComments, createTicketComment } = useSupport();
    const { data: ticket, isLoading: loadingTicket } = useTicket(id);
    const { data: comments, isLoading: loadingComments } = useTicketComments(id);

    const [newComment, setNewComment] = useState('');

    const handleSendComment = () => {
        if (!id || !newComment.trim()) return;
        createTicketComment.mutate(
            { ticketId: id, content: newComment },
            { onSuccess: () => setNewComment('') }
        );
    };

    if (loadingTicket) return <div className="container p-8"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;
    if (!ticket) return <div className="container p-8">Ticket não encontrado</div>;

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6 pb-20">
            <Button variant="ghost" size="sm" onClick={() => navigate('/support/tickets')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{ticket.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Aberto em {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm")}</span>
                        <span>•</span>
                        <span>ID: {ticket.id.slice(0, 8)}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">{ticket.category}</Badge>
                    <Badge className={
                        ticket.status === 'open' ? 'bg-blue-600' :
                            ticket.status === 'resolved' ? 'bg-green-600' : 'bg-secondary'
                    }>
                        {ticket.status === 'open' ? 'Aberto' : ticket.status === 'resolved' ? 'Resolvido' : ticket.status}
                    </Badge>
                </div>
            </div>

            {/* Main Content */}
            <Card>
                <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                </CardContent>
            </Card>

            {/* Timeline / Comments */}
            <div className="space-y-6 pt-4">
                <h3 className="text-lg font-semibold">Histórico & Comentários</h3>

                {loadingComments ?
                    <Skeleton className="h-20 w-full" /> :
                    comments?.length === 0 ?
                        <p className="text-sm text-muted-foreground italic">Nenhum comentário ainda.</p> :
                        comments?.map((comment) => (
                            <div key={comment.id} className={`flex gap-4 ${comment.is_staff_reply ? 'bg-blue-50/50 p-4 rounded-lg border border-blue-100' : ''}`}>
                                <div className="shrink-0">
                                    {comment.is_staff_reply ?
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700"><ShieldCheck className="h-5 w-5" /></div> :
                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground"><User className="h-5 w-5" /></div>
                                    }
                                </div>
                                <div className="space-y-1 w-full">
                                    <div className="flex items-center justify-between">
                                        <span className={`font-medium ${comment.is_staff_reply ? 'text-blue-700' : ''}`}>
                                            {comment.is_staff_reply ? 'Equipe HostConnect' : 'Você'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{format(new Date(comment.created_at), "dd/MM HH:mm")}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                </div>
                            </div>
                        ))
                }
            </div>

            {/* Comment Input */}
            {ticket.status !== 'closed' && (
                <Card className="mt-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Adicionar resposta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Digite sua mensagem para o suporte..."
                        />
                    </CardContent>
                    <CardFooter className="justify-end pt-0">
                        <Button size="sm" onClick={handleSendComment} disabled={createTicketComment.isPending || !newComment.trim()}>
                            {createTicketComment.isPending ? 'Enviando...' : <><Send className="mr-2 h-3 w-3" /> Enviar</>}
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
};

export default TicketDetail;
