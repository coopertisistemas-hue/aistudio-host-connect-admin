
import { useSupport, Idea } from '@/hooks/useSupport';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, AlertCircle, Lightbulb, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminIdeaList = () => {
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
        <div className="container mx-auto p-4 max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestão de Ideias</h1>
                        <p className="text-sm text-slate-500">Board de Sugestões</p>
                    </div>
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
                        <AlertCircle className="h-5 w-5" /> Erro ao carregar ideias.
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ideas?.map((idea) => (
                    <Card
                        key={idea.id}
                        className="cursor-pointer hover:shadow-lg transition-all border-t-4 border-t-purple-500"
                        onClick={() => navigate(`/support/admin/ideas/${idea.id}`)}
                    >
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-lg line-clamp-1">{idea.title}</h3>
                                <Badge variant="secondary" className="flex gap-1 shrink-0"><ThumbsUp className="h-3 w-3" /> {idea.votes}</Badge>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-3">
                                {idea.description}
                            </p>

                            <div className="flex items-center justify-between pt-2">
                                {getStatusBadge(idea.status)}
                                <span className="text-xs text-muted-foreground">{format(new Date(idea.created_at), "dd/MM")}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default AdminIdeaList;
