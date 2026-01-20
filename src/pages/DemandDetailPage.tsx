import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EntityDetailTemplate } from "@/components/EntityDetailTemplate";
import { useDemands, DemandStatus } from "@/hooks/useDemands";
import { useAuth } from "@/hooks/useAuth"; // Added useAuth
import { useOrg } from "@/hooks/useOrg";   // Added useOrg
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Construction,
    Play,
    CheckCircle2,
    Pause,
    Clock,
    User,
    AlertTriangle,
    History,
    ShieldAlert
} from "lucide-react";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DemandDetailPage = () => {
    const { id } = useParams();
    const { updateDemandStatus } = useDemands();
    const { userRole } = useAuth();
    const { currentOrgId, isLoading: isOrgLoading } = useOrg();
    const isViewer = userRole === 'viewer';

    const { data: demand, isLoading } = useQuery({
        queryKey: ['demand-detail', currentOrgId, id],
        queryFn: async () => {
            if (!currentOrgId) return null;
            const { data, error } = await supabase
                .from('tasks')
                .select(`
          *,
          rooms (
            room_number,
            status
          ),
          profiles (
            full_name
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

    const handleStatusUpdate = async (newStatus: DemandStatus) => {
        if (!demand || isViewer) return;
        const d = demand as any;
        await updateDemandStatus.mutateAsync({
            id: d.id,
            status: newStatus,
            roomId: d.room_id,
            impact_operation: d.impact_operation
        });
    };

    if (isLoading) return <DataTableSkeleton />;
    if (!demand) return <div className="p-10 text-center">Demanda não encontrada.</div>;

    const actions = [
        { label: "Iniciar", status: 'in-progress' as const, icon: Play, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Aguardar Peça", status: 'waiting' as const, icon: Pause, color: "text-amber-500", bg: "bg-amber-50" },
        { label: "Concluir", status: 'done' as const, icon: CheckCircle2, color: "text-success", bg: "bg-emerald-50" },
    ];

    return (
        <EntityDetailTemplate
            title={(demand as any).title}
            headerTitle={(demand as any).rooms?.room_number ? `Quarto ${(demand as any).rooms.room_number}` : (demand as any).category}
            headerIcon={<Construction className="h-7 w-7 text-primary" />}
            backUrl="/operation/demands"
            badge={
                <Badge variant={demand.status === 'done' ? 'success' : 'default'} className="uppercase font-bold pt-0.5">
                    {demand.status}
                </Badge>
            }
            actionsSection={
                actions.map((action) => (
                    <Button
                        key={action.status}
                        variant="outline"
                        className={`h-auto py-6 flex flex-col gap-2 border-none shadow-sm ${action.bg} hover:${action.bg} transition-all active:scale-95`}
                        onClick={() => handleStatusUpdate(action.status)}
                        disabled={demand.status === action.status || isViewer} // Disable if viewer
                    >
                        <action.icon className={`h-6 w-6 ${action.color}`} />
                        <span className={`text-xs font-bold ${action.color}`}>{action.label}</span>
                    </Button>
                ))
            }
        >
            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="py-4 px-6 border-b bg-card">
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">Informações e Histórico</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Prioridade</p>
                            <p className="text-sm font-medium flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                                {demand.priority?.toUpperCase()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Responsável</p>
                            <p className="text-sm font-medium flex items-center gap-1">
                                <User className="h-3 w-3 text-primary" />
                                {(demand as any).profiles?.full_name || 'Não atribuído'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Descrição</p>
                        <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-dashed">
                            {demand.description || "Nenhuma descrição fornecida."}
                        </p>
                    </div>

                    {(demand as any).impact_operation && (
                        <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg border border-rose-100">
                            <ShieldAlert className="h-5 w-5 text-rose-500 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-rose-700">Impacta a Operação</p>
                                <p className="text-[10px] text-rose-600">Este problema impede a venda do quarto (Status: OOO).</p>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t border-dashed">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-3">Linha do Tempo</p>
                        <div className="space-y-4">
                            <div className="flex gap-3 items-start">
                                <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-medium">Demanda Aberta</p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {format(new Date(demand.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </EntityDetailTemplate>
    );
};

export default DemandDetailPage;
