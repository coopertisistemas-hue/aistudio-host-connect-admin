import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    Bed,
    Brush,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ChevronRight,
    Filter
} from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    QuickAccessCard
} from "@/components/mobile/MobileUI";
import { useHousekeeping, HousekeepingTask } from "@/hooks/useHousekeeping";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
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

const HousekeepingList: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { user } = useAuth();
    const { tasks, isLoading } = useHousekeeping(selectedPropertyId, user?.id);
    const [activeFilter, setActiveFilter] = useState<string>("all");

    const filteredTasks = tasks.filter(task => {
        if (activeFilter === "all") return true;
        if (activeFilter === "pending") return task.status === "pending";
        if (activeFilter === "cleaning") return task.status === "cleaning";
        if (activeFilter === "completed") return task.status === "completed";
        return true;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'cleaning': return <Clock className="h-3 w-3 text-orange-500" />;
            case 'completed': return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
            default: return <Brush className="h-3 w-3 text-neutral-400" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return "bg-rose-50 text-rose-600 border-rose-100";
            case 'medium': return "bg-orange-50 text-orange-600 border-orange-100";
            default: return "bg-blue-50 text-blue-600 border-blue-100";
        }
    };

    return (
        <MobileShell
            header={
                <>
                    <MobilePageHeader
                        title="Governança"
                        subtitle="Minhas tarefas do turno"
                        rightAction={
                            <Button variant="ghost" size="icon" className="bg-white shadow-sm border border-neutral-100 rounded-xl">
                                <Filter className="h-4 w-4 text-neutral-500" />
                            </Button>
                        }
                    />

                    {/* Horizontal Filter Chips */}
                    <div className="flex gap-2 px-[var(--ui-spacing-page,20px)] overflow-x-auto pb-4 hide-scrollbar">
                        <FilterChip
                            label="Todos"
                            active={activeFilter === "all"}
                            onClick={() => setActiveFilter("all")}
                            count={tasks.length}
                        />
                        <FilterChip
                            label="Pendentes"
                            active={activeFilter === "pending"}
                            onClick={() => setActiveFilter("pending")}
                            count={tasks.filter(t => t.status === 'pending').length}
                        />
                        <FilterChip
                            label="Em Limpeza"
                            active={activeFilter === "cleaning"}
                            onClick={() => setActiveFilter("cleaning")}
                            count={tasks.filter(t => t.status === 'cleaning').length}
                        />
                        <FilterChip
                            label="Liberados"
                            active={activeFilter === "completed"}
                            onClick={() => setActiveFilter("completed")}
                        />
                    </div>
                </>
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-10">
                <div className="space-y-3">
                    {isLoading ? (
                        Array(4).fill(0).map((_, i) => (
                            <div key={i} className="h-28 bg-white/50 animate-pulse rounded-[22px]" />
                        ))
                    ) : filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <CardContainer
                                key={task.id}
                                className="p-5 border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] active:scale-[0.98] transition-all cursor-pointer relative"
                                noPadding
                            >
                                <div onClick={() => navigate(`/m/housekeeping/task/${task.id}`)} className="p-5 flex items-center justify-between">
                                    <div className="flex gap-4 items-center">
                                        <div className="h-14 w-14 rounded-2xl bg-neutral-50 flex flex-col items-center justify-center border border-neutral-100/50">
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Quarto</span>
                                            <span className="text-lg font-bold text-primary leading-tight">
                                                {task.room?.room_number || "—"}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-[#1A1C1E]">{task.room?.name || "Sem Nome"}</h3>
                                                <Badge
                                                    variant="outline"
                                                    className={cn("px-1.5 py-0 text-[8px] font-bold uppercase", getPriorityColor(task.priority))}
                                                >
                                                    {task.priority === 'high' ? 'Urgente' : task.priority}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {getStatusIcon(task.status)}
                                                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                                                    {task.status === 'pending' ? 'Pendente' : task.status === 'cleaning' ? 'Em Limpeza' : 'Liberado'}
                                                </span>
                                            </div>
                                            {task.reservation && (
                                                <p className="text-[11px] text-neutral-400 mt-0.5 italic">
                                                    Guest: {task.reservation.guest_name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <ChevronRight className="h-4 w-4 text-neutral-300" />
                                </div>
                            </CardContainer>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                            <div className="h-16 w-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                                <Brush className="h-8 w-8 text-neutral-300" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1A1C1E]">Nenhuma tarefa encontrada</h3>
                            <p className="text-sm text-neutral-500 mt-1">
                                Tudo limpo por aqui! Você não tem tarefas atribuídas para este turno.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </MobileShell>
    );
};

export default HousekeepingList;
