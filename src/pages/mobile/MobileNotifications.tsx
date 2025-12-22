import React, { useEffect } from "react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    QuickAccessCard
} from "@/components/mobile/MobileUI";
import { Bell, Info, Check, AlertCircle, Clock, Construction, Brush } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MobileNotifications: React.FC = () => {
    const { notifications, unreadCount, markAllAsRead, isLoading } = useNotifications();

    // Mark current notifications as read when entering or explicitly via button
    useEffect(() => {
        if (unreadCount > 0) {
            // markAllAsRead.mutate(); // Automated may be too aggressive, let's keep it manual or on specific action
        }
    }, [unreadCount]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'maintenance': return <Construction className="h-4 w-4 text-rose-500" />;
            case 'housekeeping': return <Brush className="h-4 w-4 text-amber-500" />;
            case 'task_update': return <Clock className="h-4 w-4 text-blue-500" />;
            default: return <AlertCircle className="h-4 w-4 text-primary" />;
        }
    };

    const getBg = (type: string) => {
        switch (type) {
            case 'maintenance': return "bg-rose-50";
            case 'housekeeping': return "bg-amber-50";
            case 'task_update': return "bg-blue-50";
            default: return "bg-primary/5";
        }
    };

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Notificações"
                    subtitle="Alertas e atualizações"
                    rightAction={
                        unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAllAsRead.mutate()}
                                className="text-[12px] font-bold text-primary active:scale-95 transition-all"
                            >
                                Ler tudo
                            </Button>
                        )
                    }
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-20">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-20 bg-white/50 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={cn(
                                    "p-4 rounded-2xl border transition-all flex gap-4 bg-white",
                                    notif.is_read ? "border-neutral-100 opacity-60" : "border-primary/10 shadow-sm"
                                )}
                            >
                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", getBg(notif.type))}>
                                    {getIcon(notif.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-[13px] leading-snug", notif.is_read ? "text-neutral-500 font-medium" : "text-[var(--ui-color-text-main)] font-bold")}>
                                        {notif.message}
                                    </p>
                                    <span className="text-[10px] text-neutral-400 mt-1 block">
                                        {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Just now
                                    </span>
                                </div>
                                {!notif.is_read && (
                                    <div className="h-2 w-2 rounded-full bg-rose-500 mt-2" />
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-[var(--ui-radius-card)] border border-[var(--ui-color-border)] shadow-[var(--ui-shadow-soft)] py-16">
                        <div className="h-20 w-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
                            <Bell className="h-10 w-10 text-neutral-300" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--ui-color-text-main)] mb-2">Sem notificações</h3>
                        <p className="text-sm text-[var(--ui-color-text-muted)] max-w-[240px]">
                            Tudo limpo por aqui! Alertas operacionais aparecerão aqui quando necessário.
                        </p>
                    </div>
                )}

                <div className="mt-8 flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Info className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-[12px] text-primary/70 font-medium leading-snug">
                        Mantenha as notificações ativas para não perder nenhum chamado urgente.
                    </p>
                </div>
            </div>
        </MobileShell>
    );
};

export default MobileNotifications;
