
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Lightbulb, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SupportHub = () => {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Ajuda & Suporte</h1>
                <p className="text-muted-foreground">
                    Gerencie seus chamados, sugira melhorias e acompanhe o status das suas solicitações.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Module: Tickets */}
                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/support/tickets')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-semibold">Meus Chamados</CardTitle>
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="mb-4">
                            Reporte erros, tire dúvidas ou solicite ajustes técnicos. Acompanhe o progresso em tempo real.
                        </CardDescription>
                        <Button variant="outline" className="w-full">
                            Ver Tickets
                        </Button>
                    </CardContent>
                </Card>

                {/* Module: Ideas */}
                <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/support/ideas')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xl font-semibold">Minhas Ideias</CardTitle>
                        <Lightbulb className="h-6 w-6 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="mb-4">
                            Tem uma sugestão de funcionalidade? Compartilhe conosco para moldarmos o futuro do produto.
                        </CardDescription>
                        <Button variant="outline" className="w-full">
                            Ver Ideias
                        </Button>
                    </CardContent>
                </Card>

                {/* External Help Center */}
                <Card className="md:col-span-2 bg-secondary/10 border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Central de Ajuda (FAQ)
                            <Badge variant="secondary" className="text-xs font-normal">Em breve</Badge>
                        </CardTitle>
                        <CardDescription>
                            Acesse nossa base de conhecimento para tutoriais e perguntas frequentes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="link" className="p-0 h-auto gap-1 text-muted-foreground" disabled>
                            Acessar Central <ExternalLink className="h-3 w-3" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SupportHub;
