
import { useSupport } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, User, ShieldCheck, Clock, ThumbsUp } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { format } from 'date-fns';

const IdeaDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { useIdea, useIdeaComments, createIdeaComment } = useSupport();
    const { data: idea, isLoading: loadingIdea } = useIdea(id);
    const { data: comments, isLoading: loadingComments } = useIdeaComments(id);

    const [newComment, setNewComment] = useState('');

    const handleSendComment = () => {
        if (!id || !newComment.trim()) return;
        createIdeaComment.mutate(
            { ideaId: id, content: newComment },
            { onSuccess: () => setNewComment('') }
        );
    };

    if (loadingIdea) return <div className="container p-8"><Skeleton className="h-12 w-full mb-4" /><Skeleton className="h-64 w-full" /></div>;
    if (!idea) return <div className="container p-8">Ideia não encontrada</div>;

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6 pb-20">
            <Button variant="ghost" size="sm" onClick={() => navigate('/support/ideas')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{idea.title}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Enviado em {format(new Date(idea.created_at), "dd/MM/yyyy")}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1 pl-2">
                        <ThumbsUp className="h-3 w-3" /> {idea.votes} Votos
                    </Badge>
                    <Badge className={
                        idea.status === 'under_review' ? 'bg-purple-600' :
                            idea.status === 'completed' ? 'bg-green-600' : 'bg-secondary'
                    }>
                        {idea.status === 'under_review' ? 'Em Análise' : idea.status}
                    </Badge>
                </div>
            </div>

            {/* Main Content */}
            <Card className="border-l-4 border-l-amber-500">
                <CardContent className="pt-6">
                    <p className="whitespace-pre-wrap leading-relaxed">{idea.description}</p>
                </CardContent>
            </Card>

            {/* Timeline / Comments */}
            <div className="space-y-6 pt-4">
                <h3 className="text-lg font-semibold">Comentários e Feedbacks</h3>

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
            <Card className="mt-6">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Adicionar comentário adicional</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Adicione mais detalhes à sua ideia..."
                    />
                </CardContent>
                <CardFooter className="justify-end pt-0">
                    <Button size="sm" onClick={handleSendComment} disabled={createIdeaComment.isPending || !newComment.trim()}>
                        {createIdeaComment.isPending ? 'Enviando...' : <><Send className="mr-2 h-3 w-3" /> Enviar</>}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default IdeaDetail;
