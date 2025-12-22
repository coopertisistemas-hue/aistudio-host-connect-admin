import React, { useState } from "react";
import { Lock, LogOut, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useSessionLock } from "@/hooks/useSessionLock";
import { useAuth } from "@/hooks/useAuth";
import { useOperationalIdentity } from "@/hooks/useOperationalIdentity";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SessionLockManagerProps {
    children: React.ReactNode;
}

export const SessionLockManager: React.FC<SessionLockManagerProps> = ({ children }) => {
    const { isLocked, isWarning, unlock, resetIdleTimer } = useSessionLock();
    const { user, signOut } = useAuth();
    const { selectedPropertyId } = useSelectedProperty();
    const { data: identity } = useOperationalIdentity(selectedPropertyId);

    const [password, setPassword] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("[SessionLock] Unlocking sequence started");

        // Safety check: if user session is lost in background, force re-login
        if (!user || !user.email) {
            console.warn("[SessionLock] No user/email found, forcing signout");
            toast.error("Sessão expirada. Faça login novamente.");
            handleSignOut(); // Use the robust sign out
            return;
        }

        if (!password) {
            console.log("[SessionLock] Password empty");
            return;
        }

        setIsAuthenticating(true);
        setError(null);

        try {
            console.log("[SessionLock] Attempting auth for:", user.email);

            // Create a timeout promise
            const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
                setTimeout(() => resolve({ timeout: true }), 20000); // 20s timeout
            });

            // Race between auth and timeout
            const result = await Promise.race([
                supabase.auth.signInWithPassword({
                    email: user.email,
                    password: password,
                }),
                timeoutPromise
            ]);

            console.log("[SessionLock] Auth result:", result);

            // Handle Timeout
            if ('timeout' in result) {
                throw new Error("TIMEOUT");
            }

            const { error: authError } = result;

            if (authError) {
                console.error("[SessionLock] Auth error:", authError);
                if (authError.message.includes("Invalid login")) {
                    setError("Senha incorreta");
                    toast.error("Senha incorreta.");
                } else if (authError.message.includes("network")) {
                    setError("Erro de conexão");
                    toast.error("Sem conexão com a internet.");
                } else {
                    setError("Erro ao validar: " + authError.message);
                    toast.error("Não foi possível validar sua senha.");
                }
            } else {
                console.log("[SessionLock] Success! Unlocking...");
                setPassword("");
                unlock();
                toast.success("Sessão retomada");
            }
        } catch (err: any) {
            console.error("[SessionLock] Exception:", err);
            if (err.message === "TIMEOUT") {
                setError("Tempo limite excedido");
                toast.error("A validação demorou muito. Verifique sua conexão.");
            } else {
                setError("Erro inesperado: " + (err.message || "Desconhecido"));
                toast.error("Ocorreu um erro ao tentar desbloquear.");
            }
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleSignOut = () => {
        console.log("[SessionLock] Force signing out...");

        // CRITICAL: Unlock locally first to prevent "Auto-Lock" upon re-login
        unlock();

        // Non-blocking sign out sequence
        try {
            signOut(); // Fire and forget supabase signout
        } catch (e) {
            console.warn("Supabase signout failed", e);
        }

        // Force navigation immediately. Do not wait.
        setTimeout(() => {
            window.location.href = '/auth';
        }, 100);
    };

    return (
        <div className="relative min-h-[100dvh]">
            {children}

            {/* Inactivity Warning Banner */}
            {isWarning && !isLocked && (
                <div className="fixed top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 right-4 z-[100] animate-in slide-in-from-top duration-500">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-amber-900 leading-tight">Sessão expirando</span>
                                <span className="text-[11px] text-amber-700">Toque para continuar trabalhando</span>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-amber-200 bg-white text-amber-700 font-bold h-9 active:scale-95 transition-all"
                            onClick={resetIdleTimer}
                        >
                            Continuar
                        </Button>
                    </div>
                </div>
            )}

            {/* Lock Screen Overlay */}
            {isLocked && (
                <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center px-8 text-center animate-in fade-in duration-300 backdrop-blur-md">
                    <div className="w-full max-w-sm space-y-8">
                        {/* Header Identity */}
                        <div className="flex flex-col items-center space-y-4">
                            <Avatar className="h-24 w-24 rounded-3xl border-4 border-emerald-50 shadow-xl overflow-hidden bg-emerald-50">
                                {identity?.client_logo_url ? (
                                    <AvatarImage src={identity.client_logo_url} className="object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <ShieldCheck className="h-10 w-10 text-emerald-600" />
                                    </div>
                                )}
                                <AvatarFallback className="text-2xl font-bold text-emerald-600 bg-emerald-50">
                                    {identity?.client_short_name?.charAt(0) || "H"}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold text-[var(--ui-color-text-main)] tracking-tight">
                                    {identity?.client_short_name || "Host Connect"}
                                </h2 >
                                <p className="text-sm text-[var(--ui-color-text-muted)] font-medium">
                                    Sessão bloqueada para <span className="text-[var(--ui-color-text-main)] font-bold">{identity?.staff_short_name}</span>
                                </p>
                            </div>
                        </div>

                        {/* Unlock Form */}
                        <form onSubmit={handleUnlock} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    name="password"
                                    id="password"
                                    placeholder="Senha de acesso"
                                    className="h-14 rounded-2xl text-center text-lg bg-neutral-50 border-neutral-100 focus:bg-white focus:ring-emerald-500/20 transition-all font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    disabled={isAuthenticating}
                                />
                                {error && <p className="text-xs font-bold text-rose-500">{error}</p>}
                            </div>

                            <Button
                                className="w-full h-14 rounded-2xl text-base font-bold bg-neutral-900 hover:bg-black shadow-lg active:scale-[0.98] transition-all"
                                disabled={isAuthenticating || !password}
                                type="submit"
                            >
                                {isAuthenticating ? "Verificando..." : "Desbloquear"}
                            </Button>
                        </form>

                        {/* Footer Options */}
                        <div className="pt-4 flex flex-col items-center gap-6">
                            <button
                                onClick={handleSignOut}
                                type="button"
                                className="flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                Sair da conta
                            </button>

                            <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-[0.2em]">
                                PROTEGIDO POR HOST CONNECT SECURITY
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
