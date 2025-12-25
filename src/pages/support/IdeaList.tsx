
import { useSupport, Idea } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ArrowLeft, Loader2, Lightbulb, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const IdeaList = () => {
    const navigate = useNavigate();
    const { useIdeas } = useSupport();
    const { data: ideas, isLoading, isError } = useIdeas();

    const getStatusBadge = (status: Idea['status']) => {
        switch (status) {
            case 'under_review': return <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">Em Análise</Badge>;
            case 'planned': return <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">Planejada</Badge>;
            case 'in_progress': return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Em Desenvolvimento</Badge>;
            case 'completed': return <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Concluída</Badge>;
            case 'declined': return <Badge variant="secondary">Arquivada</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
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
                        <h1 className="text-2xl font-bold tracking-tight">Minhas Ideias</h1>
                        <p className="text-sm text-muted-foreground">Sugestões de melhoria</p>
                    </div>
                </div>
                <Button onClick={() => navigate('/support/ideas/new')}>
                    <Plus className="mr-2 h-4 w-4" /> Nova Ideia
                </Button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {!isLoading && !isError && ideas?.length === 0 && (
                <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhuma ideia sugerida</p>
                    <p className="text-sm mb-4">Ajude a melhorar o sistema compartilhando suas sugestões.</p>
                    <Button variant="outline" onClick={() => navigate('/support/ideas/new')}>Sugerir Ideia</Button>
                </div>
            )}

            <div className="grid gap-4">
                {ideas?.map((idea) => (
                    <Card key={idea.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/support/ideas/${idea.id}`)}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium truncate pr-4">{idea.title}</CardTitle>
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <ThumbsUp className="h-3 w-3" /> {idea.votes}
                                </span>
                                {getStatusBadge(idea.status)}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{idea.description}</p>
                            <div className="flex items-center justify-end text-xs text-muted-foreground mt-4">
                                <span>{format(new Date(idea.created_at), "d 'de' MMMM", { locale: ptBR })}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default IdeaList;
