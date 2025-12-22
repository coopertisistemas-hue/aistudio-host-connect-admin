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

/**
 * MobileShell: The root layout for all mobile-only pages (/m/*)
 * Implements a flex-col structure with dvh support and safe-area resilience.
 */
export const MobileShell: React.FC<{ children: React.ReactNode; header?: React.ReactNode }> = ({ children, header }) => {
    return (
        <div className="min-h-[100dvh] flex flex-col bg-[var(--ui-surface-bg)] overflow-hidden">
            {header}
            <main className="flex-1 flex flex-col hide-scrollbar overflow-y-auto">
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
export const MobileTopHeader: React.FC = () => {
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
        <header className="px-[var(--ui-spacing-page,20px)] pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-4 flex items-center justify-between border-b border-[var(--ui-color-border)] bg-white">
            <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-2xl border border-neutral-100 shadow-sm overflow-hidden bg-neutral-100/50 shrink-0">
                    {identity?.client_logo_url && (
                        <AvatarImage src={identity.client_logo_url} className="object-cover" />
                    )}
                    <AvatarFallback className="rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-[15px] uppercase tracking-tighter">
                        {identity?.client_short_name
                            ? identity.client_short_name.split(' ').map(n => n[0]).join('').slice(0, 2)
                            : "HC"}
                    </AvatarFallback>
                </Avatar>

                <div className="flex flex-col min-w-0">
                    <h1 className="text-[16px] font-bold text-[var(--ui-color-text-main)] leading-tight truncate max-w-[200px]">
                        {identity?.client_short_name || "Operações"}
                    </h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px] font-medium text-[var(--ui-color-text-muted)] truncate max-w-[150px]">
                            {identity?.staff_short_name || "Membro da Equipe"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => navigate("/m/notifications")}
                    className="h-10 w-10 rounded-full flex items-center justify-center active:scale-95 transition-all text-neutral-400 relative"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                    )}
                </button>
                <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center active:scale-95 transition-all text-neutral-400",
                        isRefreshing && "opacity-50"
                    )}
                >
                    <RotateCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
                </button>
                <button
                    onClick={signOut}
                    className="h-10 w-10 rounded-full flex items-center justify-center active:scale-95 transition-all text-neutral-400"
                >
                    <LogOut className="h-5 w-5" />
                </button>
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
