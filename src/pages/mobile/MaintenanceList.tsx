import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer
} from "@/components/mobile/MobileUI";
import { useMaintenance, MaintenanceTask } from "@/hooks/useMaintenance";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Badge } from "@/components/ui/badge";
import { CreateMaintenanceSheet } from "@/components/mobile/CreateMaintenanceSheet";
import {
    Wrench,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ChevronRight,
    Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const FilterChip = ({
    label,
    active,
    onClick,
    count
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    count?: number;
}) => (
    <button
        onClick={onClick}
        className={cn(
            "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
            active
                ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20"
                : "bg-white text-neutral-500 border-neutral-100"
        )}
    >
        {label}
        {count !== undefined && count > 0 && (
            <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-400"
            )}>
                {count}
            </span>
        )}
    </button>
);

const MaintenanceList: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { tasks, isLoading } = useMaintenance(selectedPropertyId);
    const [activeFilter, setActiveFilter] = useState<string>("open");

    const filteredTasks = tasks.filter(task => {
        if (activeFilter === "all") return true;
        if (activeFilter === "open") return task.status === "pending" || task.status === "in_progress";
        if (activeFilter === "solved") return task.status === "completed";
        return true;
    });

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'pending': return { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-50", label: "Aberto" };
            case 'in_progress': return { icon: Clock, color: "text-orange-500", bg: "bg-orange-50", label: "Em Andamento" };
            case 'completed': return { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50", label: "Resolvido" };
            default: return { icon: Wrench, color: "text-neutral-500", bg: "bg-neutral-50", label: status };
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return "bg-rose-100 text-rose-700 border-rose-200";
            case 'medium': return "bg-orange-100 text-orange-700 border-orange-200";
            default: return "bg-blue-50 text-blue-600 border-blue-100";
        }
    };

    return (
        <MobileShell
            header={
                <>
                    <MobilePageHeader
                        title="Manutenção"
                        subtitle="Gerencie os chamados"
                    />
                    <div className="flex gap-2 px-[var(--ui-spacing-page,20px)] overflow-x-auto pb-4 hide-scrollbar">
                        <FilterChip
                            label="Abertos"
                            active={activeFilter === "open"}
                            onClick={() => setActiveFilter("open")}
                            count={tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
                        />
                        <FilterChip
                            label="Resolvidos"
                            active={activeFilter === "solved"}
                            onClick={() => setActiveFilter("solved")}
                            count={tasks.filter(t => t.status === 'completed').length}
                        />
                        <FilterChip
                            label="Todos"
                            active={activeFilter === "all"}
                            onClick={() => setActiveFilter("all")}
                            count={tasks.length}
                        />
                    </div>
                </>
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-20 space-y-3">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-24 bg-white/50 animate-pulse rounded-[22px]" />
                    ))
                ) : filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => {
                        const statusConfig = getStatusConfig(task.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                            <CardContainer
                                key={task.id}
                                className="p-4 border-none shadow-sm active:scale-[0.98] transition-all"
                                onClick={() => navigate(`/m/maintenance/${task.id}`)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", statusConfig.bg)}>
                                            <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase block leading-none mb-1">
                                                {format(new Date(task.created_at), "dd/MM 'às' HH:mm")}
                                            </span>
                                            <Badge variant="outline" className={cn("px-1.5 py-0 text-[9px] uppercase font-bold border-0", getPriorityColor(task.priority))}>
                                                Priority: {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                            </Badge>
                                        </div>
                                    </div>
                                    {task.room && (
                                        <div className="bg-neutral-100 text-neutral-600 px-2 py-1 rounded-md text-xs font-bold">
                                            {task.room.room_number}
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-[#1A1C1E] text-sm mb-1 line-clamp-1">{task.title}</h3>
                                {task.description && (
                                    <p className="text-xs text-neutral-500 line-clamp-2">{task.description}</p>
                                )}

                                <div className="mt-3 pt-3 border-t border-neutral-100 flex justify-between items-center">
                                    <span className={cn("text-[10px] font-bold uppercase", statusConfig.color)}>
                                        {statusConfig.label}
                                    </span>
                                    {task.assigned_to ? (
                                        <div className="flex items-center gap-1">
                                            <div className="h-4 w-4 rounded-full bg-neutral-200 text-[8px] flex items-center justify-center font-bold text-neutral-600">
                                                {task.assignee?.full_name?.charAt(0) || "U"}
                                            </div>
                                            <span className="text-[10px] text-neutral-400 truncate max-w-[80px]">
                                                {task.assignee?.full_name?.split(' ')[0]}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-neutral-400 italic">Sem responsável</span>
                                    )}
                                </div>
                            </CardContainer>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                        <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-neutral-300" />
                        </div>
                        <h3 className="text-lg font-bold text-[#1A1C1E]">Tudo certo!</h3>
                        <p className="text-sm text-neutral-500 mt-1">
                            Nenhum chamado encontrado com este filtro.
                        </p>
                    </div>
                )}
            </div>

            <CreateMaintenanceSheet />
        </MobileShell>
    );
};

export default MaintenanceList;
