import React, { useState } from "react";
import { UtensilsCrossed, Filter, Plus, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow
} from "@/components/mobile/MobileUI";
import { Button } from "@/components/ui/button";
import { usePantry, PantryTask } from "@/hooks/usePantry";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { CreatePantrySheet } from "@/components/mobile/CreatePantrySheet";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const PantryList: React.FC = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { tasks, isLoading, updateStatus } = usePantry(selectedPropertyId);
    const [view, setView] = useState<'active' | 'done'>('active');

    const activeTasks = tasks.filter(t => t.status !== 'done');
    const doneTasks = tasks.filter(t => t.status === 'done');
    const displayTasks = view === 'active' ? activeTasks : doneTasks;

    const handleAction = (task: PantryTask) => {
        if (task.status === 'pending') {
            updateStatus.mutate({ taskId: task.id, status: 'in_progress' });
        } else if (task.status === 'in_progress') {
            updateStatus.mutate({ taskId: task.id, status: 'done' });
        }
    };

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Copa & Cozinha"
                    subtitle="Demandas operacionais"
                    rightAction={
                        <CreatePantrySheet>
                            <Button variant="ghost" size="icon" className="text-orange-500 bg-orange-50 rounded-xl">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </CreatePantrySheet>
                    }
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-24">

                {/* Tabs */}
                <div className="flex p-1 bg-neutral-100 rounded-xl mb-6">
                    <button
                        onClick={() => setView('active')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            view === 'active' ? "bg-white text-orange-600 shadow-sm" : "text-neutral-400"
                        )}
                    >
                        PENDENTES ({activeTasks.length})
                    </button>
                    <button
                        onClick={() => setView('done')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            view === 'done' ? "bg-white text-neutral-600 shadow-sm" : "text-neutral-400"
                        )}
                    >
                        CONCLUÍDAS
                    </button>
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="text-center py-10 text-neutral-400 text-sm">Carregando...</div>
                ) : displayTasks.length > 0 ? (
                    <div className="space-y-3">
                        {displayTasks.map((task) => (
                            <CardContainer
                                key={task.id}
                                className={cn(
                                    "p-4 border-l-4 shadow-sm flex flex-col gap-3 transition-all",
                                    task.status === 'pending' ? "border-l-orange-500" :
                                        task.status === 'in_progress' ? "border-l-blue-500" :
                                            "border-l-emerald-500 opacity-60"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="font-bold text-[#1A1C1E] text-sm">{task.title}</h3>
                                            <span className="text-[10px] text-neutral-400 font-mono">
                                                {format(new Date(task.created_at), "HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-500 mb-2">
                                            {task.description || "Sem descrição"}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            {task.room && (
                                                <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                                                    {task.room.room_number}
                                                </span>
                                            )}
                                            <span className={cn(
                                                "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                                task.status === 'pending' ? "bg-orange-50 text-orange-600" :
                                                    task.status === 'in_progress' ? "bg-blue-50 text-blue-600" :
                                                        "bg-emerald-50 text-emerald-600"
                                            )}>
                                                {task.status === 'pending' ? 'Pendente' :
                                                    task.status === 'in_progress' ? 'Em Preparo' : 'Entregue'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {task.status !== 'done' && (
                                    <div className="flex gap-2 border-t border-neutral-50 pt-3 mt-1">
                                        <Button
                                            size="sm"
                                            onClick={() => handleAction(task)}
                                            disabled={updateStatus.isPending}
                                            variant={task.status === 'pending' ? 'default' : 'secondary'}
                                            className={cn(
                                                "w-full h-9 text-xs font-bold gap-2",
                                                task.status === 'pending' ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                            )}
                                        >
                                            {task.status === 'pending' ? (
                                                <>
                                                    <PlayCircle className="h-4 w-4" /> INICIAR PREPARO
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4" /> CONCLUIR
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </CardContainer>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
                        <div className="h-16 w-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                            <UtensilsCrossed className="h-8 w-8 text-neutral-300" />
                        </div>
                        <h3 className="text-base font-bold text-neutral-400 mb-1">
                            {view === 'active' ? "Tudo tranquilo" : "Sem histórico"}
                        </h3>
                        <p className="text-xs text-neutral-400 max-w-[200px]">
                            {view === 'active'
                                ? "Nenhuma demanda pendente para a copa no momento."
                                : "Nenhuma demanda concluída recentemente."}
                        </p>
                        {view === 'active' && (
                            <div className="mt-6">
                                <CreatePantrySheet>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" /> Nova Solicitação
                                    </Button>
                                </CreatePantrySheet>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </MobileShell>
    );
};

export default PantryList;
