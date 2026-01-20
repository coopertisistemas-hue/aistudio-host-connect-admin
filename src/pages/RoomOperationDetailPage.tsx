import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { RoomStatusBadge } from "@/components/RoomStatusBadge";
import { useRoomOperation, RoomOperationalStatus } from "@/hooks/useRoomOperation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    ArrowLeft,
    RefreshCcw,
    History,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ShieldAlert,
    LogOut,
    Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";

const RoomOperationDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { updateStatus, getStatusLogs } = useRoomOperation();
    const { isAdmin } = useIsAdmin();
    const { userRole } = useAuth();
    const { currentOrgId, isLoading: isOrgLoading } = useOrg();
    const isViewer = userRole === 'viewer';

    const { data: room, isLoading: roomLoading } = useQuery({
        queryKey: ['room-detail', currentOrgId, id],
        queryFn: async () => {
            if (!currentOrgId) return null;
            const { data, error } = await supabase
                .from('rooms')
                .select(`
          *,
          room_types (
            name
          )
        `)
                .eq('id', id)
                .eq('org_id', currentOrgId) // 🔐 ALWAYS filter by org_id
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!id && !isOrgLoading && !!currentOrgId,
    });

    const { data: logs, isLoading: logsLoading } = getStatusLogs(id || '');

    const handleStatusChange = async (newStatus: RoomOperationalStatus) => {
        if (!room || isViewer) return;

        try {
            await updateStatus.mutateAsync({
                roomId: room.id,
                newStatus,
                oldStatus: room.status,
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (roomLoading) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto space-y-6">
                    <DataTableSkeleton />
                </div>
            </DashboardLayout>
        );
    }

    if (!room) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20">
                    <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-xl font-bold">Quarto não encontrado</h2>
                    <Button variant="link" onClick={() => navigate('/operation/rooms')} className="mt-2">
                        Voltar para o quadro
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const actions = [
        { label: getRoomStatusLabel(RoomStatus.DIRTY), status: RoomStatus.DIRTY, icon: RefreshCcw, color: "text-rose-500", bg: "bg-rose-50" },
        { label: getRoomStatusLabel(RoomStatus.CLEAN), status: RoomStatus.CLEAN, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
        { label: getRoomStatusLabel(RoomStatus.INSPECTED), status: RoomStatus.INSPECTED, icon: ShieldAlert, color: "text-indigo-500", bg: "bg-indigo-50" },
        { label: "Fora de Serviço", status: 'ooo' as const, icon: Settings, color: "text-slate-500", bg: "bg-slate-50" },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6 pb-10">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 -ml-2 text-muted-foreground"
                    onClick={() => navigate('/operation/rooms')}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Quadro
                </Button>

                {/* Room Header Card */}
                <Card className="overflow-hidden border-none shadow-sm">
                    <div className="bg-primary/5 p-6 flex items-center justify-between border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                <span className="text-2xl font-bold text-primary">{room.room_number}</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">{room.room_types?.name}</h1>
                                <p className="text-sm text-muted-foreground">ID: {room.id.split('-')[0]}</p>
                            </div>
                        </div>
                        <RoomStatusBadge status={room.status as any} className="text-sm px-4 py-1" />
                    </div>
                </Card>

                {/* Action Grid */}
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Ações Operacionais</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {actions.map((action) => (
                            <Button
                                key={action.status}
                                variant="outline"
                                className={`h-auto py-6 flex flex-col gap-2 border-none shadow-sm ${action.bg} hover:${action.bg} transition-all active:scale-95`}
                                onClick={() => handleStatusChange(action.status)}
                                disabled={room.status === action.status || isViewer} // Disable if viewer
                            >
                                <action.icon className={`h-6 w-6 ${action.color}`} />
                                <span className={`text-xs font-bold ${action.color}`}>{action.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Audit Trail */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="py-4 px-6 border-b bg-card">
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-primary" />
                            <CardTitle className="text-base">Histórico de Alterações</CardTitle>
                        </div>
                        <CardDescription className="text-xs">Últimas 10 mudanças de status operacionais</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {logsLoading ? (
                            <div className="p-6">
                                <DataTableSkeleton />
                            </div>
                        ) : !logs || logs.length === 0 ? (
                            <div className="p-10 text-center">
                                <p className="text-sm text-muted-foreground italic">Nenhuma alteração registrada ainda.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {logs.map((log) => (
                                    <div key={log.id} className="p-4 flex gap-4 items-start">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium">
                                                    Status: {log.new_status.toUpperCase()}
                                                </p>
                                                <time className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(log.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                                                </time>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Alterado por: <span className="text-foreground font-medium">{log.profiles?.full_name || 'Usuário'}</span>
                                            </p>
                                            {log.reason && (
                                                <div className="mt-2 p-2 bg-muted rounded text-[10px] text-muted-foreground italic">
                                                    "{log.reason}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default RoomOperationDetailPage;
