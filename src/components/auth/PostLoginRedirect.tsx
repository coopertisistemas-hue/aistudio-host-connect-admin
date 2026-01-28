import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { safeLogger } from '@/lib/logging/safeLogger';

type RedirectStatus = 'checking' | 'redirecting' | 'fallback';

/**
 * PostLoginRedirect - Versão Simplificada
 * Redireciona o usuário após login baseado em seu perfil e permissões.
 * 
 * Fluxo:
 * 1. Verifica se usuário está autenticado
 * 2. Aguarda carregamento do perfil
 * 3. Redireciona baseado em role/onboarding
 * 4. Fallback após 15s se algo travar
 */
const PostLoginRedirect = () => {
    const { user, userRole, isSuperAdmin, onboardingCompleted, loading, signOut, profileError, debugTrace } = useAuth();
    const navigate = useNavigate();

    const [status, setStatus] = useState<RedirectStatus>('checking');
    const [fallbackReason, setFallbackReason] = useState<string>('');

    // 1. Hard Timeout Enforcer (15 segundos)
    useEffect(() => {
        safeLogger.info('post_login.mounted');
        const timer = setTimeout(() => {
            setStatus(current => {
                if (current === 'redirecting') return current;
                safeLogger.warn('post_login.timeout_fired', { waitedMs: 15000 });
                setFallbackReason('timeout');
                return 'fallback';
            });
        }, 15000);

        return () => clearTimeout(timer);
    }, []);

    // 2. Lógica de Redirecionamento
    useEffect(() => {
        if (status !== 'checking') return;

        safeLogger.debug('post_login.check_state', {
            loading,
            hasUser: !!user,
            onboardingKnown: onboardingCompleted !== null,
            role: userRole || 'none',
            isSuperAdmin
        });

        // Aguardar carregamento
        if (loading) return;

        // Sem usuário → voltar para login
        if (!user) {
            safeLogger.info('post_login.decision', { outcome: 'redirect_auth', reason: 'no_user' });
            setStatus('redirecting');
            navigate('/auth', { replace: true });
            return;
        }

        // Aguardar perfil carregar
        if (onboardingCompleted === null) {
            // Perfil ainda carregando ou falhou
            // Timeout vai capturar se demorar muito
            return;
        }

        // Super Admin → Dashboard
        if (isSuperAdmin) {
            safeLogger.info('post_login.decision', { outcome: 'redirect', reason: 'super_admin' });
            setStatus('redirecting');
            navigate('/dashboard', { replace: true });
            return;
        }

        // Onboarding incompleto → Setup
        if (!onboardingCompleted) {
            safeLogger.info('post_login.decision', { outcome: 'redirect', reason: 'onboarding_incomplete' });
            setStatus('redirecting');
            navigate('/setup', { replace: true });
            return;
        }

        // Roteamento baseado em role
        let destination = '/front-desk';
        switch (userRole) {
            case 'staff_housekeeping':
                destination = '/m/housekeeping';
                break;
            case 'admin':
            case 'manager':
            case 'staff_frontdesk':
            case 'viewer':
            default:
                destination = '/front-desk';
                break;
        }

        safeLogger.info('post_login.decision', {
            outcome: 'redirect',
            reason: 'role_match',
            destination,
            role: userRole
        });
        setStatus('redirecting');
        navigate(destination, { replace: true });

    }, [user, userRole, isSuperAdmin, onboardingCompleted, loading, status, navigate]);

    // 3. Ações
    const handleLogout = async () => {
        await signOut();
        navigate('/auth');
    };

    // 4. Fallback UI
    if (status === 'fallback') {
        const isProfileError = !loading && user && onboardingCompleted === null;

        let title = 'O carregamento demorou muito';
        let message = 'Sua conexão pode estar instável ou o sistema está demorando para responder.';
        let operatorInstruction = '';

        if (isProfileError) {
            switch (profileError) {
                case 'not_found':
                    title = 'Conta sem perfil associado';
                    message = 'Seu usuário existe, mas não possui um perfil configurado.';
                    operatorInstruction = 'Solicite ao administrador a criação do seu perfil de acesso.';
                    break;
                case 'forbidden':
                    title = 'Acesso Negado';
                    message = 'Você não tem permissão para acessar os dados deste perfil.';
                    operatorInstruction = 'Verifique se seu usuário possui as permissões corretas (RLS).';
                    break;
                case 'error':
                default:
                    title = 'Erro ao carregar perfil';
                    message = 'Não conseguimos recuperar seus dados de acesso.';
                    break;
            }
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                            <LogOut className="h-6 w-6 text-destructive" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-xl font-semibold">{title}</h1>
                        <p className="text-sm text-muted-foreground">{message}</p>
                        {operatorInstruction && (
                            <div className="bg-muted/50 p-3 rounded-md border border-border/50">
                                <p className="text-xs text-muted-foreground font-mono">{operatorInstruction}</p>
                            </div>
                        )}

                        {/* Debug Overlay (apenas se habilitado) */}
                        {localStorage.getItem('hc_debug_queries') === '1' && debugTrace && (
                            <div className="bg-slate-950 text-slate-200 p-4 rounded-md text-left text-xs font-mono border border-slate-800 space-y-2 mt-4 overflow-x-auto">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <span className="font-bold text-yellow-500">DEBUG: Backend Trace</span>
                                    {debugTrace?.outcome ? (
                                        <span className={`px-1.5 py-0.5 rounded ${debugTrace.outcome === 'ok' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {debugTrace.outcome}
                                        </span>
                                    ) : (
                                        <span className="text-slate-500">Running...</span>
                                    )}
                                </div>
                                {debugTrace ? (
                                    <div className="grid grid-cols-[80px_1fr] gap-1">
                                        <span className="text-slate-500">Step:</span>
                                        <span className="text-blue-300">{debugTrace.name}</span>

                                        <span className="text-slate-500">Table:</span>
                                        <span className="text-purple-300">{debugTrace.table}</span>

                                        <span className="text-slate-500">Query:</span>
                                        <span className="break-all">
                                            .{debugTrace.modifiers?.maybeSingle ? 'maybeSingle' : 'select'}(
                                            <span className="text-cyan-300">"{debugTrace.select}"</span>
                                            )
                                            {debugTrace.filters?.map((f, i) => (
                                                <span key={i} className="block pl-4">
                                                    .{f.op}(<span className="text-orange-300">"{f.column}"</span>, [REDACTED])
                                                </span>
                                            ))}
                                        </span>

                                        <span className="text-slate-500">Duration:</span>
                                        <span>
                                            {debugTrace.durationMs
                                                ? `${debugTrace.durationMs.toFixed(0)}ms`
                                                : <span className="text-red-400">Never settled (Timeout)</span>}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-slate-500 italic">No backend trace recorded.</div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button onClick={handleLogout} variant="destructive" className="w-full">
                            Sair e tentar novamente
                        </Button>
                        <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                            Recarregar página
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // 5. Loading UI
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                    Carregando ambiente...
                </p>
            </div>
        </div>
    );
};

export default PostLoginRedirect;
