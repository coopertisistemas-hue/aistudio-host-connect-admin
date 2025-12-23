import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow,
    PrimaryBottomCTA
} from "@/components/mobile/MobileUI";
import { useMaintenance } from "@/hooks/useMaintenance";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    User,
    Calendar,
    MapPin,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const MaintenanceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { user } = useAuth();
    const { tasks, updateStatus, assignToMe } = useMaintenance(selectedPropertyId);

    const task = tasks.find(t => t.id === id);

    if (!task) {
        return (
            <MobileShell header={<MobilePageHeader title="Chamado não encontrado" />}>
                <div className="p-10 text-center">
                    <p className="text-neutral-500">Este chamado não existe ou foi removido.</p>
                </div>
            </MobileShell>
        );
    }

    const isAssignedToMe = user && task.assigned_to === user.id;
    const isCompleted = task.status === 'completed';

    const handleMainAction = () => {
        if (isCompleted) return; // Should not happen ideally

        if (!task.assigned_to) {
            // Assign to me
            assignToMe.mutate({ taskId: task.id, userId: user!.id });
        } else if (isAssignedToMe) {
            // I am working on it -> Resolve
            updateStatus.mutate({ taskId: task.id, status: 'completed' });
            navigate('/m/maintenance');
        } else {
            // Someone else is working. We might want to allow "Steal" or "Assist", but for now disabled or nothing
        }
    };

    const getActionLabel = () => {
        if (isCompleted) return null;
        if (!task.assigned_to) return "ASSUMIR CHAMADO";
        if (isAssignedToMe) return "FINALIZAR E RESOLVER";
        return `EM ATENDIMENTO POR ${task.assignee?.full_name?.split(' ')[0].toUpperCase()}`;
    };

    const actionLabel = getActionLabel();
    const isActionDisabled = !!task.assigned_to && !isAssignedToMe;

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Detalhes do Chamado"
                    subtitle={`#${task.room?.room_number} • ${format(new Date(task.created_at), "dd/MM HH:mm")}`}
                />
            }
        >
            <div className="px-5 pb-32 space-y-6">

                {/* Status Card */}
                <CardContainer className="p-5 border-none shadow-sm flex items-center justify-between bg-neutral-900 text-white">
                    <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">Status Atual</span>
                        <div className="text-xl font-bold flex items-center gap-2">
                            {task.status === 'pending' && "Aberto"}
                            {task.status === 'in_progress' && "Em Andamento"}
                            {task.status === 'completed' && "Resolvido"}
                        </div>
                    </div>
                    <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center bg-white/10",
                        task.status === 'pending' && "text-rose-400",
                        task.status === 'in_progress' && "text-orange-400",
                        task.status === 'completed' && "text-emerald-400"
                    )}>
                        <AlertCircle className="h-6 w-6" />
                    </div>
                </CardContainer>

                <div>
                    <SectionTitleRow title="Informações" />
                    <CardContainer className="p-5 border-none shadow-sm space-y-4">
                        <div className="flex gap-4">
                            <MapPin className="h-5 w-5 text-neutral-400 shrink-0" />
                            <div>
                                <span className="block text-xs text-neutral-400 font-bold uppercase mb-0.5">Local</span>
                                <span className="text-sm font-semibold text-[#1A1C1E]">{task.room?.name} - {task.room?.room_number}</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <User className="h-5 w-5 text-neutral-400 shrink-0" />
                            <div>
                                <span className="block text-xs text-neutral-400 font-bold uppercase mb-0.5">Solicitante / Responsável</span>
                                <span className="text-sm font-semibold text-[#1A1C1E]">
                                    {task.assignee ? task.assignee.full_name : "Aguardando técnico"}
                                </span>
                            </div>
                        </div>
                    </CardContainer>
                </div>

                <div>
                    <SectionTitleRow title="Problema Relatado" />
                    <CardContainer className="p-5 border-none shadow-sm">
                        <h3 className="font-bold text-lg text-[#1A1C1E] mb-2">{task.title}</h3>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                            {task.description || "Nenhuma descrição detalhada fornecida."}
                        </p>
                    </CardContainer>
                </div>

            </div>

            {actionLabel && (
                <PrimaryBottomCTA
                    label={actionLabel}
                    onClick={handleMainAction}
                    disabled={isActionDisabled}
                    loading={updateStatus.isPending || assignToMe.isPending}
                />
            )}
        </MobileShell>
    );
};

export default MaintenanceDetail;
