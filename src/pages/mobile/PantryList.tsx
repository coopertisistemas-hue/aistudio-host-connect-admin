import React, { useState, useMemo } from "react";
import {
    UtensilsCrossed,
    Filter,
    Plus,
    CheckCircle2,
    Clock,
    PlayCircle,
    ArrowRight,
    ChefHat,
    Coffee
} from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow,
    PremiumSkeleton,
    StatusBadge
} from "@/components/mobile/MobileUI";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { usePantry, PantryTask } from "@/hooks/usePantry";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { CreatePantrySheet } from "@/components/mobile/CreatePantrySheet";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PantryList: React.FC = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { tasks, isLoading, updateStatus } = usePantry(selectedPropertyId);

    const [activeFilter, setActiveFilter] = useState<string>("active"); // active, done, all
    const [selectedTask, setSelectedTask] = useState<PantryTask | null>(null);

    // --- KPIs ---
    const kpis = useMemo(() => {
        return {
            pending: tasks.filter(t => t.status === 'pending').length,
            prep: tasks.filter(t => t.status === 'in_progress').length,
            done: tasks.filter(t => t.status === 'done').length
        };
    }, [tasks]);

    // --- Filter Logic ---
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (activeFilter === "all") return true;
            if (activeFilter === "active") return task.status !== "done";
            if (activeFilter === "pending") return task.status === "pending";
            if (activeFilter === "prep") return task.status === "in_progress";
            if (activeFilter === "done") return task.status === "done";
            return true;
        });
    }, [tasks, activeFilter]);

    // --- Components ---
    const UpdateStatusSheet = ({ task }: { task: PantryTask }) => {
        const handleStatus = (status: string) => {
            updateStatus.mutate({ taskId: task.id, status });
            setSelectedTask(null);
        };

        const steps = [
            { status: 'pending', label: 'Pendente', icon: Clock, color: 'text-orange-500 bg-orange-50 border-orange-200' },
            { status: 'in_progress', label: 'Em Preparo', icon: ChefHat, color: 'text-blue-500 bg-blue-50 border-blue-200' },
            { status: 'done', label: 'Concluído / Entregue', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
        ];

        return (
            <div className="space-y-6 pt-4">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 mb-6">
                    <p className="text-xs font-bold text-neutral-400 uppercase">Pedido</p>
                    <p className="text-base font-medium text-neutral-800">{task.title}</p>
                    {task.description && <p className="text-sm text-neutral-500 mt-2 italic">"{task.description}"</p>}
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {steps.map((step) => (
                        <button
                            key={step.status}
                            onClick={() => handleStatus(step.status)}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all",
                                task.status === step.status
                                    ? `ring-1 ring-primary border-primary/50 relative overflow-hidden`
                                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                            )}
                        >
                            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center border", step.color, task.status === step.status ? "" : "grayscale opacity-50 bg-neutral-100 border-neutral-200")}>
                                <step.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 text-left">
                                <span className={cn("text-sm font-bold block", task.status === step.status ? "text-neutral-900" : "text-neutral-500")}>
                                    {step.label}
                                </span>
                                {task.status === step.status && <span className="text-[10px] text-primary font-bold uppercase">Status Atual</span>}
                            </div>
                            {task.status !== step.status && (
                                <ArrowRight className="h-4 w-4 text-neutral-300" />
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Copa & Cozinha"
                    subtitle="Demandas do dia"
                    rightAction={
                        <CreatePantrySheet>
                            <Button size="icon" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </CreatePantrySheet>
                    }
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-24 space-y-6">

                {/* HERO KPI */}
                <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-[24px] p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="relative z-10 grid grid-cols-3 gap-2 text-center divide-x divide-white/10">
                        <div className="flex flex-col items-center cursor-pointer" onClick={() => setActiveFilter("pending")}>
                            <span className="text-3xl font-bold">{kpis.pending}</span>
                            <span className="text-[10px] uppercase font-bold opacity-80 mt-1">Pendentes</span>
                        </div>
                        <div className="flex flex-col items-center cursor-pointer" onClick={() => setActiveFilter("prep")}>
                            <span className="text-3xl font-bold">{kpis.prep}</span>
                            <span className="text-[10px] uppercase font-bold opacity-80 mt-1">Preparo</span>
                        </div>
                        <div className="flex flex-col items-center cursor-pointer" onClick={() => setActiveFilter("done")}>
                            <span className="text-3xl font-bold">{kpis.done}</span>
                            <span className="text-[10px] uppercase font-bold opacity-80 mt-1">Entregues</span>
                        </div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {[
                        { id: 'active', label: 'Ativos' },
                        { id: 'all', label: 'Todos' },
                        { id: 'pending', label: 'Pendentes' },
                        { id: 'prep', label: 'Em Preparo' },
                        { id: 'done', label: 'Concluídos' },
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                activeFilter === filter.id
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : "bg-white text-neutral-500 border-neutral-100"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* TASK LIST */}
                <div className="space-y-3">
                    {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                            <PremiumSkeleton key={i} className="h-28 w-full rounded-[20px]" />
                        ))
                    ) : filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className={cn(
                                    "bg-white p-5 rounded-[20px] border shadow-sm relative overflow-hidden active:scale-[0.99] transition-transform cursor-pointer group",
                                    task.status === 'pending' ? "border-l-4 border-l-orange-500 border-y-neutral-100 border-r-neutral-100" :
                                        task.status === 'in_progress' ? "border-l-4 border-l-blue-500 border-y-neutral-100 border-r-neutral-100" :
                                            "border-neutral-100 opacity-80"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2 mb-1">
                                            {task.room ? (
                                                <div className="bg-neutral-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-neutral-600 uppercase">
                                                    Quarto {task.room.room_number}
                                                </div>
                                            ) : (
                                                <div className="bg-neutral-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-neutral-600 uppercase">
                                                    Interno
                                                </div>
                                            )}
                                            <span className="text-[10px] text-neutral-400 font-mono">
                                                {format(new Date(task.created_at), "HH:mm")}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-bold text-neutral-800 leading-tight">{task.title}</h3>
                                    </div>

                                    {task.status === 'pending' && <Clock className="h-5 w-5 text-orange-500" />}
                                    {task.status === 'in_progress' && <ChefHat className="h-5 w-5 text-blue-500 animate-pulse" />}
                                    {task.status === 'done' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                </div>

                                {task.description && (
                                    <p className="text-xs text-neutral-500 mt-2 line-clamp-2">{task.description}</p>
                                )}

                                {task.status !== 'done' && (
                                    <div className="mt-4 pt-3 border-t border-dashed border-neutral-100 flex justify-end">
                                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                                            Atualizar <ArrowRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <CardContainer className="py-12 flex flex-col items-center justify-center text-center bg-emerald-50/50 border-emerald-100/50 border-dashed">
                            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
                                <Coffee className="h-6 w-6 text-emerald-300" />
                            </div>
                            <p className="text-sm font-bold text-emerald-800">Sem pedidos na fila</p>
                            <p className="text-xs text-emerald-600/60">Aproveite o intervalo!</p>
                        </CardContainer>
                    )}
                </div>

            </div>

            {/* UPDATE SHEET */}
            <Sheet open={!!selectedTask} onOpenChange={(o) => !o && setSelectedTask(null)}>
                <SheetContent side="bottom" className="rounded-t-[32px]">
                    <SheetHeader className="pb-2 text-left border-b border-neutral-100">
                        <SheetTitle>Atualizar Pedido</SheetTitle>
                        <SheetDescription>Altere o status para acompanhar o fluxo.</SheetDescription>
                    </SheetHeader>
                    {selectedTask && <UpdateStatusSheet task={selectedTask} />}
                </SheetContent>
            </Sheet>

        </MobileShell>
    );
};

export default PantryList;
