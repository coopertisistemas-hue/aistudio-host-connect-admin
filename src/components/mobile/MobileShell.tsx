import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, LogOut, User, Bell, MapPin, BadgeCheck, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useProperties } from "@/hooks/useProperties";
import { useNotifications } from "@/hooks/useNotifications";
import { useOperationalIdentity } from "@/hooks/useOperationalIdentity";
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
} from "@/components/ui/alert-dialog";

/**
 * MobileShell: The root layout for all mobile-only pages (/m/*)
 * Implements a flex-col structure with dvh support and safe-area resilience.
 */
export const MobileShell: React.FC<{ children: React.ReactNode; header?: React.ReactNode }> = ({ children, header }) => {
    const { pathname } = useLocation();
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
    }, [pathname]);

    return (
        <div className="min-h-[100dvh] flex flex-col bg-[var(--ui-surface-bg)] overflow-hidden">
            {header}
            <main
                ref={scrollRef}
                className="flex-1 flex flex-col hide-scrollbar overflow-y-auto"
            >
                <div className="flex-1">
                    {children}
                </div>
                <MobileFooter />
            </main>
        </div>
    );
};

/**
 * MobileTopHeader: Main branding and status header for the Home screen
 */
export const MobileTopHeader: React.FC<{
    showBack?: boolean;
    title?: string;
    subtitle?: string;
}> = ({ showBack, title, subtitle }) => {
    const { user, signOut } = useAuth();
    const { selectedPropertyId } = useSelectedProperty();
    const { properties } = useProperties();
    const { unreadCount } = useNotifications();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const selectedProperty = properties.find(p => p.id === selectedPropertyId);

    const { data: identity } = useOperationalIdentity(selectedPropertyId);

    const handleRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);

        try {
            // Invalidate all queries to force a background refetch
            await queryClient.invalidateQueries();
            // Optional: short delay to ensure the spin animation is visible and feels "real"
            await new Promise(resolve => setTimeout(resolve, 800));
            toast.success("Dados atualizados");
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full px-[var(--ui-spacing-page,20px)] pt-[calc(env(safe-area-inset-top,0px)+8px)] pb-2 flex items-center justify-between bg-white/85 backdrop-blur-xl border-b border-white/40 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] transition-all duration-200">
            <div className="flex items-center gap-3">
                {showBack ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 -ml-2 rounded-full hover:bg-neutral-100 text-neutral-600 shrink-0"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                ) : (
                    <Avatar className="h-10 w-10 rounded-full border border-white/60 shadow-sm overflow-hidden bg-neutral-100/50 shrink-0 ring-1 ring-white/50">
                        {identity?.client_logo_url && (
                            <AvatarImage src={identity.client_logo_url} className="object-cover" />
                        )}
                        <AvatarFallback className="bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-700 font-bold text-[12px] uppercase tracking-tighter">
                            {(identity?.client_short_name || selectedProperty?.name || "HC")
                                .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}

                <div className="flex flex-col min-w-0">
                    <h1 className="text-[15px] font-black text-neutral-800 leading-none truncate max-w-[200px] tracking-tight mb-0.5">
                        {title || identity?.client_short_name || selectedProperty?.name || "Host Connect"}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 truncate max-w-[200px] uppercase tracking-widest opacity-90">
                            {subtitle || `Operações • ${identity?.staff_short_name || user?.user_metadata?.full_name?.split(' ')[0] || "Equipe"}`}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => navigate("/m/notifications")}
                    className="h-9 w-9 rounded-full flex items-center justify-center active:bg-neutral-100 transition-all text-neutral-400 hover:text-neutral-600 relative"
                >
                    <Bell className="h-4.5 w-4.5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 bg-rose-500 rounded-full ring-2 ring-white" />
                    )}
                </button>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center active:bg-neutral-100 transition-all text-neutral-400 hover:text-neutral-600",
                        isRefreshing && "opacity-50"
                    )}
                >
                    <RotateCw className={cn("h-4.5 w-4.5", isRefreshing && "animate-spin")} />
                </button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button
                            className="h-9 w-9 rounded-full flex items-center justify-center active:bg-neutral-100 transition-all text-neutral-400 hover:text-rose-500"
                            title="Sair"
                        >
                            <LogOut className="h-4.5 w-4.5" />
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-[85vw] w-full rounded-2xl border-neutral-100 shadow-xl bg-white/95 backdrop-blur-md">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-lg font-bold text-neutral-800">Sair da conta?</AlertDialogTitle>
                            <AlertDialogDescription className="text-neutral-500">
                                Você precisará autenticar novamente para voltar ao Operações.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-row gap-2 justify-end">
                            <AlertDialogCancel className="mt-0 flex-1 rounded-xl border-neutral-200 text-neutral-600 font-semibold h-11">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={signOut}
                                className="flex-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold h-11"
                            >
                                Sair
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </header>
    );
};

/**
 * MobilePageHeader: Standard header for sub-pages with navigation/actions
 */
export const MobilePageHeader: React.FC<{
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}> = ({ title, subtitle, showBack = true, rightAction }) => {
    const navigate = useNavigate();

    return (
        <header className="px-[var(--ui-spacing-page,20px)] pt-[calc(env(safe-area-inset-top,0px)+24px)] pb-6 flex items-center gap-4">
            {showBack && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-[var(--ui-radius-input)] bg-white shadow-[var(--ui-shadow-soft)] border border-neutral-100 shrink-0 active:scale-95 transition-all"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
            )}
            <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-[var(--ui-color-text-main)] truncate">{title}</h1>
                {subtitle && <p className="text-[13px] text-[var(--ui-color-text-muted)] truncate mt-0.5">{subtitle}</p>}
            </div>
            {rightAction && <div className="shrink-0">{rightAction}</div>}
        </header>
    );
};

/**
 * MobileFooter: Standardized footer for all mobile pages
 * Displays branding and versioning info at the end of scroll.
 */
export const MobileFooter: React.FC = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { properties } = useProperties();
    const selectedProperty = properties.find(p => p.id === selectedPropertyId);

    return (
        <footer className="mt-auto px-[var(--ui-spacing-page,20px)] py-12 pb-[calc(env(safe-area-inset-bottom,0px)+32px)] text-center opacity-40">
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.25em] mb-2">
                DESENVOLVIDO POR URUBICI CONNECT • v2.4.0
            </p>
            <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-[0.15em]">
                {selectedProperty?.name || "Host Connect"} © {new Date().getFullYear()}
            </p>
        </footer>
    );
};
