import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Clock,
    CheckCircle2,
    AlertTriangle,
    User,
    Calendar,
    ArrowLeft
} from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow,
    PrimaryBottomCTA
} from "@/components/mobile/MobileUI";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MobileTaskDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: task, isLoading } = useQuery({
        queryKey: ['task-detail', id],
        queryFn: async () => {
            if (!id) throw new Error("No ID provided");
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    room:rooms(name, room_number),
                    reporter:profiles!tasks_assigned_to_fkey(full_name)
                `)
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data;
        },
        enabled: !!id
    });

    const updateStatus = useMutation({
        mutationFn: async (newStatus: string) => {
            const { error } = await supabase
                .from('tasks')
                .update({ status: newStatus })
                .eq('id', id);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task-detail', id] });
            queryClient.invalidateQueries({ queryKey: ['operations-now-summary'] }); // Refresh Ops Now
            toast.success("Status atualizado!");
            navigate(-1);
        },
        onError: () => {
            toast.error("Erro ao atualizar status.");
        }
    });

    if (isLoading) {
        return (
            <MobileShell header={<MobilePageHeader title="Carregando..." />}>
                <div className="flex justify-center p-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </MobileShell>
        );
    }

    if (!task) {
        return (
            <MobileShell header={<MobilePageHeader title="Não encontrado" />}>
                <div className="p-10 text-center text-neutral-500">
                    Tarefa não encontrada.
                </div>
            </MobileShell>
        );
    }

    const isCompleted = task.status === 'completed' || task.status === 'done';

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Detalhes da Ocorrência"
                    backButton={<Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>}
                />
            }
        >
            <div className="px-5 pb-32 space-y-6">
                
                {/* Header Info */}
                <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "px-2 py-1 rounded text-[10px] font-bold uppercase",
                            task.priority === 'high' ? "bg-rose-100 text-rose-700" :
                            task.priority === 'medium' ? "bg-orange-100 text-orange-700" :
                            "bg-blue-100 text-blue-700"
                        )}>
                            {task.priority === 'high' ? 'Alta Prioridade' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono">
                            {format(new Date(task.created_at), "dd/MM HH:mm")}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#1A1C1E] leading-tight">
                        {task.title}
                    </h1>
                </div>

                {/* Main Content */}
                <CardContainer className="p-5 border-none shadow-sm space-y-4">
                    
                    {/* Description */}
                    <div>
                        <h3 className="text-xs font-bold text-neutral-500 uppercase mb-2">Descrição</h3>
                        <p className="text-sm text-neutral-700 leading-relaxed">
                            {task.description || "Sem descrição detalhada."}
                        </p>
                    </div>

                    <div className="h-px bg-neutral-100 w-full" />

                    {/* Meta Data Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {task.room && (
                            <div>
                                <h3 className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Local</h3>
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded bg-neutral-100 flex items-center justify-center text-neutral-500">
                                        <span className="text-xs font-bold">{task.room.room_number}</span>
                                    </div>
                                    <span className="text-sm font-medium text-neutral-700 truncate max-w-[100px]">{task.room.name}</span>
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <h3 className="text-[10px] font-bold text-neutral-400 uppercase mb-1">Reportado por</h3>
                            <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-neutral-400" />
                                <span className="text-sm font-medium text-neutral-700">
                                    {task.reporter?.full_name?.split(' ')[0] || "Sistema"}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContainer>

                {/* Status Card */}
                <CardContainer className={cn(
                    "p-4 border border-l-4 shadow-sm flex items-center gap-3",
                    isCompleted ? "border-l-emerald-500 bg-emerald-50/50" : "border-l-amber-500 bg-amber-50/50"
                )}>
                    {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                        <Clock className="h-5 w-5 text-amber-500" />
                    )}
                    <div>
                        <span className="block text-sm font-bold text-[#1A1C1E]">
                            {isCompleted ? "Resolvido" : "Pendente"}
                        </span>
                        <span className="text-xs text-neutral-500">
                            {isCompleted ? "Essa ocorrência foi finalizada." : "Aguardando resolução."}
                        </span>
                    </div>
                </CardContainer>

            </div>

            {/* Action Button */}
            {!isCompleted && (
                <PrimaryBottomCTA
                    label="MARCAR COMO RESOLVIDO"
                    onClick={() => updateStatus.mutate('done')}
                    loading={updateStatus.isPending}
                />
            )}
        </MobileShell>
    );
};

export default MobileTaskDetail;
