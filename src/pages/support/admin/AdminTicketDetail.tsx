
import { useSupport, Ticket } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, ShieldCheck, User, Save, Clock, Loader2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const AdminTicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { useTicket, useTicketComments, createTicketComment, updateTicket } = useSupport();
    const { data: ticket, isLoading: loadingTicket } = useTicket(id);
    const { data: comments, isLoading: loadingComments } = useTicketComments(id);

    const [newComment, setNewComment] = useState('');
    const [status, setStatus] = useState<Ticket['status']>('open');
    const [severity, setSeverity] = useState<Ticket['severity']>('low');

    useEffect(() => {
        if (ticket) {
            setStatus(ticket.status);
            setSeverity(ticket.severity);
        }
    }, [ticket]);

    const handleUpdateTicket = () => {
        if (!id) return;
        updateTicket.mutate({ id, updates: { status, severity } });
    };

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
        <div className="container mx-auto p-4 max-w-6xl space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate('/support/admin/tickets')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Lista
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Content (Left) */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{ticket.title}</CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                        <Clock className="h-3 w-3" />
                                        <span>Aberto {format(new Date(ticket.created_at), "dd/MM/yyyy HH:mm")}</span>
                                        <span className="font-mono text-xs bg-slate-100 px-1 rounded">ID: {ticket.id}</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-50 p-4 rounded-md border text-sm leading-relaxed whitespace-pre-wrap">
                                {ticket.description}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Comments */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-blue-600" /> Comunicação Interna & Respostas</h3>

                        {loadingComments ? <Skeleton className="h-20 w-full" /> :
                            comments?.map((comment) => (
                                <div key={comment.id} className={`flex gap-4 ${comment.is_staff_reply ? 'flex-row-reverse' : ''}`}>
                                    <div className="shrink-0">
                                        {comment.is_staff_reply ?
                                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">HC</div> :
                                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600"><User className="h-4 w-4" /></div>
                                        }
                                    </div>
                                    <div className={`space-y-1 max-w-[80%] ${comment.is_staff_reply ? 'text-right' : ''}`}>
                                        <div className="text-xs text-muted-foreground">
                                            {comment.is_staff_reply ? 'Staff HostConnect' : 'Usuário'} • {format(new Date(comment.created_at), "dd/MM HH:mm")}
                                        </div>
                                        <div className={`p-3 rounded-lg text-sm border ${comment.is_staff_reply ? 'bg-blue-50 border-blue-100 text-slate-800' : 'bg-white border-slate-200'}`}>
                                            {comment.content}
                                        </div>
                                    </div>
                                </div>
                            ))}

                        {/* Reply Box */}
                        <Card className="border-blue-100 shadow-sm">
                            <CardContent className="pt-4">
                                <Textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Escrever resposta oficial..."
                                    className="min-h-[100px] border-blue-100 focus-visible:ring-blue-500"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <div className="text-xs text-muted-foreground">
                                        * As respostas são visíveis para o usuário.
                                    </div>
                                    <Button size="sm" onClick={handleSendComment} disabled={createTicketComment.isPending || !newComment.trim()}>
                                        {createTicketComment.isPending ? 'Enviando...' : <><Send className="mr-2 h-3 w-3" /> Enviar Resposta</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Sidebar Controls (Right) */}
                <div className="space-y-4">
                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader>
                            <CardTitle className="text-lg">Controles do Ticket</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Status Atual</Label>
                                <Select value={status} onValueChange={(val: Ticket['status']) => setStatus(val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Aberto</SelectItem>
                                        <SelectItem value="in_progress">Em Análise</SelectItem>
                                        <SelectItem value="resolved">Resolvido</SelectItem>
                                        <SelectItem value="closed">Fechado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Severidade</Label>
                                <Select value={severity} onValueChange={(val: Ticket['severity']) => setSeverity(val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Baixo</SelectItem>
                                        <SelectItem value="medium">Médio</SelectItem>
                                        <SelectItem value="high">Alto</SelectItem>
                                        <SelectItem value="critical">Crítico</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4">
                                <Button className="w-full" onClick={handleUpdateTicket} disabled={updateTicket.isPending}>
                                    {updateTicket.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Salvar Alterações
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Metadados</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Categoria:</span>
                                <span className="font-medium capitalize">{ticket.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">User ID:</span>
                                <span className="font-mono text-xs">{ticket.user_id.slice(0, 8)}...</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default AdminTicketDetail;
