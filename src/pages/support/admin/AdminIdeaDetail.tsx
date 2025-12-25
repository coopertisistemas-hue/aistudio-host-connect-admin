
import { useSupport, Idea } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CheckCircle2, XCircle, CalendarClock, PlayCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const AdminIdeaDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { useIdea, updateIdea } = useSupport();
    const { data: idea, isLoading } = useIdea(id);

    const handleDecision = (status: Idea['status']) => {
        if (!id) return;
        updateIdea.mutate({ id, updates: { status } });
    };

    if (isLoading) return <div className="container p-8"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;
    if (!idea) return <div className="container p-8">Ideia não encontrada</div>;

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6 pb-20">
            <Button variant="ghost" size="sm" onClick={() => navigate('/support/admin/ideas')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Board
            </Button>

            <div className="space-y-4 text-center pb-8 border-b">
                <h1 className="text-3xl font-bold text-slate-900">{idea.title}</h1>
                <div className="text-slate-500">
                    Sugerido em {format(new Date(idea.created_at), "dd/MM/yyyy")} • {idea.votes} Votos
                </div>
            </div>

            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="pt-6">
                    <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">{idea.description}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Decisão Atual</h3>
                    <div className={`p-6 rounded-lg text-center border-2 border-dashed ${idea.status === 'under_review' ? 'border-purple-300 bg-purple-50' :
                            idea.status === 'completed' ? 'border-green-300 bg-green-50' :
                                idea.status === 'declined' ? 'border-slate-300 bg-slate-50' : 'border-blue-300 bg-blue-50'
                        }`}>
                        <div className="text-xl font-bold uppercase tracking-widest text-slate-700 mb-2">
                            {idea.status.replace('_', ' ')}
                        </div>
                        <p className="text-sm text-slate-500">Status atual do item no roadmap.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Ações Administrativas</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            className="justify-start h-auto py-3 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handleDecision('planned')}
                        >
                            <CalendarClock className="mr-3 h-5 w-5 text-blue-500" />
                            <div className="text-left">
                                <div className="font-semibold">Planejar (Roadmap)</div>
                                <div className="text-xs text-muted-foreground">Adicionar à fila de desenvolvimento futuro.</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="justify-start h-auto py-3 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                            onClick={() => handleDecision('in_progress')}
                        >
                            <PlayCircle className="mr-3 h-5 w-5 text-amber-500" />
                            <div className="text-left">
                                <div className="font-semibold">Iniciar Desenvolvimento</div>
                                <div className="text-xs text-muted-foreground">Marcar como trabalho em andamento.</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="justify-start h-auto py-3 border-green-200 hover:bg-green-50 hover:text-green-700"
                            onClick={() => handleDecision('completed')}
                        >
                            <CheckCircle2 className="mr-3 h-5 w-5 text-green-500" />
                            <div className="text-left">
                                <div className="font-semibold">Concluir Entrega</div>
                                <div className="text-xs text-muted-foreground">Funcionalidade entregue e disponível.</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="justify-start h-auto py-3 border-slate-200 hover:bg-slate-50"
                            onClick={() => handleDecision('declined')}
                        >
                            <XCircle className="mr-3 h-5 w-5 text-slate-400" />
                            <div className="text-left">
                                <div className="font-semibold">Arquivar / Rejeitar</div>
                                <div className="text-xs text-muted-foreground">Não está nos planos no momento.</div>
                            </div>
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminIdeaDetail;
