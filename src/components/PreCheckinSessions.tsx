import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePreCheckinSessions } from '@/hooks/usePreCheckinSessions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Link2, Plus, CheckCircle, Clock, Copy, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

interface PreCheckinSessionsProps {
    bookingId: string;
}

const PreCheckinSessions = ({ bookingId }: PreCheckinSessionsProps) => {
    const { user } = useAuth();
    const isViewer = user?.user_metadata?.role === 'viewer';

    const { sessions, isLoading, createSession, finalizeSession } =
        usePreCheckinSessions(bookingId);

    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [generatedToken, setGeneratedToken] = useState<string | null>(null);

    const handleGenerateSession = async () => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para gerar sessões de pré-check-in.',
                variant: 'destructive',
            });
            return;
        }

        try {
            const session = await createSession.mutateAsync(bookingId);
            setGeneratedToken(session.token);
            setShowGenerateDialog(false);
        } catch (error) {
            // Toast is handled by the hook
        }
    };

    const handleFinalizeSession = async (sessionId: string) => {
        if (isViewer) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para finalizar sessões.',
                variant: 'destructive',
            });
            return;
        }

        try {
            await finalizeSession.mutateAsync(sessionId);
        } catch (error) {
            // Toast is handled by the hook
        }
    };

    const copyTokenToClipboard = (token: string) => {
        navigator.clipboard.writeText(token);
        toast({
            title: 'Copiado',
            description: 'Token copiado para a área de transferência.',
        });
    };

    const copyLinkToClipboard = (token: string) => {
        // TODO: Replace with actual pre-check-in URL when implemented
        const link = `${window.location.origin}/pre-checkin/${token}`;
        navigator.clipboard.writeText(link);
        toast({
            title: 'Link copiado',
            description: 'Link de pré-check-in copiado para a área de transferência.',
        });
    };

    const getStatusBadge = (status: string, expiresAt: string) => {
        const isExpired = new Date(expiresAt) < new Date();

        if (status === 'completed') {
            return <Badge variant="default" className="bg-green-600">Completo</Badge>;
        }
        if (status === 'expired' || isExpired) {
            return <Badge variant="destructive">Expirado</Badge>;
        }
        return <Badge variant="secondary">Pendente</Badge>;
    };

    if (isLoading) {
        return (
            <Card className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                    Carregando sessões...
                </div>
            </Card>
        );
    }

    return (
        <>
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Link2 className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Pré-Check-in</h3>
                        <Badge variant="secondary">{sessions.length}</Badge>
                    </div>
                    {!isViewer && (
                        <AlertDialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                            <AlertDialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Gerar Link
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Gerar Link de Pré-Check-in?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Um token único será gerado para esta reserva. O link expirará em 7 dias.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleGenerateSession}
                                        disabled={createSession.isPending}
                                    >
                                        Gerar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>

                {sessions.length === 0 ? (
                    <div className="text-center py-8">
                        <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">
                            Nenhuma sessão de pré-check-in gerada
                        </p>
                        {!isViewer && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Clique em "Gerar Link" para criar uma sessão
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session) => {
                            const isExpired = new Date(session.expires_at) < new Date();
                            const isPending = session.status === 'pending' && !isExpired;

                            return (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {getStatusBadge(session.status, session.expires_at)}
                                            <span className="text-sm text-muted-foreground">
                                                Criado em {format(new Date(session.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Expira em: {format(new Date(session.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </div>
                                        {isPending && (
                                            <div className="flex items-center gap-2 mt-2">
                                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                                    {session.token.substring(0, 16)}...
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyTokenToClipboard(session.token)}
                                                >
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Token
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyLinkToClipboard(session.token)}
                                                >
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Link
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {!isViewer && isPending && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" size="sm">
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Finalizar
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Finalizar Pré-Check-in?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Marcar esta sessão como completa. Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleFinalizeSession(session.id)}
                                                        disabled={finalizeSession.isPending}
                                                    >
                                                        Finalizar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {/* Token Display Dialog */}
            {generatedToken && (
                <Dialog open={!!generatedToken} onOpenChange={() => setGeneratedToken(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Link de Pré-Check-in Gerado</DialogTitle>
                            <DialogDescription>
                                Compartilhe este link com o hóspede. Ele expirará em 7 dias.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Token:</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 text-xs bg-muted p-3 rounded overflow-x-auto">
                                        {generatedToken}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyTokenToClipboard(generatedToken)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium">Link:</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 text-xs bg-muted p-3 rounded overflow-x-auto break-all">
                                        {window.location.origin}/pre-checkin/{generatedToken}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyLinkToClipboard(generatedToken)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-muted p-4 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <strong>Nota:</strong> O formulário de pré-check-in será implementado posteriormente.
                                    Por enquanto, use este link como placeholder.
                                </p>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
};

export default PreCheckinSessions;
