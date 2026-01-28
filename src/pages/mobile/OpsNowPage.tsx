import React from "react";
import { useNavigate } from "react-router-dom";
import {
    MobileShell,
    MobilePageHeader
} from "@/components/mobile/MobileShell";
import {
    CardContainer,
    SectionTitleRow
} from "@/components/mobile/MobileUI";
import { useOperationsNow } from "@/hooks/useOperationsNow";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { CreateOccurrenceSheet } from "@/components/mobile/CreateOccurrenceSheet";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    ArrowRight,
    Search,
    LogIn,
    LogOut,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const OpsNowPage: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { summary, isLoading } = useOperationsNow(selectedPropertyId);

    const { criticalTasks, recentOccurrences, priorityRooms } = summary || { criticalTasks: [], recentOccurrences: [], priorityRooms: [] };

    // Group priority rooms by type
    const today = new Date().toISOString().split('T')[0];
    const arrivals = priorityRooms.filter(b => b.check_in === today);
    const departures = priorityRooms.filter(b => b.check_out === today);

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Operação Agora"
                    subtitle="Visão geral do turno"
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-10 space-y-6">

                {/* Priority / Critical Section */}
                <div>
                    <SectionTitleRow title="Prioridades" />
                    {criticalTasks.length > 0 ? (
                        <div className="space-y-3">
                            {criticalTasks.map((task) => (
                                <CardContainer
                                    key={task.id}
                                    className="p-4 border-l-4 border-l-rose-500 flex gap-3 items-start active:scale-[0.98] transition-all"
                                    onClick={() => {
                                        if (task.type === 'maintenance') navigate(`/m/maintenance/${task.id}`);
                                        else if (task.type === 'housekeeping') navigate(`/m/housekeeping`);
                                        else navigate(`/m/task/${task.id}`);
                                    }}
                                >
                                    <div className="bg-rose-50 p-2 rounded-full shrink-0">
                                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-[#1A1C1E] text-sm">{task.title || "Tarefa Crítica"}</h3>
                                            <span className="text-[10px] text-neutral-400 font-mono">
                                                {format(new Date(task.created_at), "HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                                            {task.description || "Sem descrição"}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Alta Prioridade</span>
                                            {task.room && (
                                                <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">{task.room.room_number}</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContainer>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 bg-white/50 border border-dashed border-neutral-200 rounded-2xl text-center">
                            <span className="text-sm text-neutral-400">Nenhuma pendência crítica no momento.</span>
                        </div>
                    )}
                </div>

                {/* Rooms Flow */}
                <div>
                    <SectionTitleRow title="Fluxo de Quartos" />
                    <div className="grid grid-cols-2 gap-3">
                        <CardContainer
                            className="p-4 border-none shadow-sm flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all"
                            onClick={() => navigate('/m/rooms')} // Or specific filtered view if available
                        >
                            <div className="h-10 w-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center">
                                <LogIn className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-[#1A1C1E]">{arrivals.length}</span>
                                <span className="text-xs text-neutral-500 uppercase font-bold">Chegadas</span>
                            </div>
                        </CardContainer>
                        <CardContainer
                            className="p-4 border-none shadow-sm flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-all"
                            onClick={() => navigate('/m/rooms')}
                        >
                            <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
                                <LogOut className="h-5 w-5" />
                            </div>
                            <div className="text-center">
                                <span className="block text-2xl font-bold text-[#1A1C1E]">{departures.length}</span>
                                <span className="text-xs text-neutral-500 uppercase font-bold">Saídas</span>
                            </div>
                        </CardContainer>
                    </div>
                </div>

                {/* Recent Occurrences */}
                <div>
                    <SectionTitleRow
                        title="Ocorrências"
                        action={<CreateOccurrenceSheet />}
                    />
                    {recentOccurrences.length > 0 ? (
                        <div className="space-y-3">
                            {recentOccurrences.map((occ) => (
                                <CardContainer
                                    key={occ.id}
                                    className="p-4 border-none shadow-sm active:scale-[0.98] transition-all"
                                    onClick={() => navigate(`/m/task/${occ.id}`)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-[#1A1C1E] text-sm">{occ.title}</h3>
                                        <span className="text-[10px] text-neutral-400">
                                            {format(new Date(occ.created_at), "dd/MM HH:mm")}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
                                        {occ.description}
                                    </p>
                                    <div className="flex items-center justify-between border-t border-neutral-50 pt-2">
                                        <div className="flex gap-2">
                                            {occ.room && (
                                                <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                                                    {occ.room.room_number}
                                                </span>
                                            )}
                                            <span className={cn(
                                                "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                                occ.priority === 'high' ? "text-rose-600 bg-rose-50" : "text-blue-600 bg-blue-50"
                                            )}>
                                                {occ.priority === 'high' ? 'Alta' : 'Normal'}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-neutral-400">
                                            {occ.reporter?.full_name?.split(' ')[0] || "Sistema"}
                                        </span>
                                    </div>
                                </CardContainer>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-white rounded-2xl border border-neutral-100">
                            <div className="h-12 w-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="h-5 w-5 text-neutral-300" />
                            </div>
                            <p className="text-sm text-neutral-400">Nenhuma ocorrência registrada recentemente.</p>
                            <div className="mt-4">
                                <CreateOccurrenceSheet>
                                    <Button variant="outline" size="sm">Registrar Nova</Button>
                                </CreateOccurrenceSheet>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </MobileShell>
    );
};

export default OpsNowPage;
