import React, { useState, useMemo } from "react";
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
    Filter,
    ClipboardList,
    Camera,
    Save,
    X,
    User
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
    SheetFooter
} from "@/components/ui/sheet";
import { useHousekeeping, HousekeepingTask } from "@/hooks/useHousekeeping";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { trackOperation } from "@/lib/analytics"; // Analytics

const HousekeepingList: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { user } = useAuth();

    // View Mode: 'my' = Assigned to me, 'all' = Everyone
    const [viewMode, setViewMode] = useState<"my" | "all">("my");
    const { tasks, isLoading, updateTaskStatus } = useHousekeeping(selectedPropertyId, viewMode === 'my' ? user?.id : null);

    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);

    // --- KPIs ---
    const kpis = useMemo(() => {
        return {
            dirty: tasks.filter(t => t.status === 'pending').length,
            cleaning: tasks.filter(t => t.status === 'cleaning').length,
            inspect: tasks.filter(t => t.status === 'completed' || t.status === 'inspected').length, // 'completed' waits inspection usually
            clean: tasks.filter(t => t.status === 'inspected').length // Assuming inspected = ready
        };
    }, [tasks]);

    // --- Filter Logic ---
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            if (activeFilter === "all") return true;
            if (activeFilter === "dirty") return task.status === "pending";
            if (activeFilter === "cleaning") return task.status === "cleaning";
            if (activeFilter === "inspection") return task.status === "completed";
            if (activeFilter === "clean") return task.status === "inspected";
            return true;
        });
    }, [tasks, activeFilter]);

    // --- Quick Update Sheet Components ---
    const UpdateSheet = () => {
        const [newStatus, setNewStatus] = useState<HousekeepingTask['status']>(selectedTask?.status || 'cleaning');
        const [notes, setNotes] = useState(selectedTask?.notes || "");
        const [checklist, setChecklist] = useState({
            bed: false,
            bath: false,
            floor: false,
            trash: false,
            amenities: false
        });

        const handleSave = () => {
            if (!selectedTask) return;

            // Append checklist to notes for pilot
            const checklistSummary = Object.entries(checklist)
                .filter(([_, checked]) => checked)
                .map(([key]) => key)
                .join(", ");

            const finalNotes = notes + (checklistSummary ? ` | Checklist: ${checklistSummary}` : "");

            updateTaskStatus.mutate({
                taskId: selectedTask.id,
                roomId: selectedTask.room_id,
                status: newStatus,
                notes: finalNotes
            });

            trackOperation('update_status', 'housekeeping', newStatus); // Analytics
            setSelectedTask(null);
        };

        const statusOptions: { value: HousekeepingTask['status'], label: string, color: string }[] = [
            { value: 'pending', label: 'Sujo', color: 'bg-rose-100 text-rose-700 border-rose-200' },
            { value: 'cleaning', label: 'Em Limpeza', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            { value: 'completed', label: 'Pronto / Vistoria', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { value: 'inspected', label: 'Liberado (Limpo)', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        ];

        return (
            <div className="space-y-6">
                {/* Status Selection */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Novo Status</Label>
                    <div className="grid grid-cols-2 gap-2">
                        {statusOptions.map((opt) => (
                            <div
                                key={opt.value}
                                onClick={() => setNewStatus(opt.value)}
                                className={cn(
                                    "p-3 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all",
                                    newStatus === opt.value
                                        ? `ring-2 ring-primary border-transparent ${opt.color}`
                                        : "bg-white border-neutral-100 text-neutral-500 hover:bg-neutral-50"
                                )}
                            >
                                <span className="text-sm font-bold">{opt.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Checklist */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Checklist Rápido</Label>
                    <div className="bg-white p-4 rounded-xl border border-neutral-100 space-y-3">
                        <div className="flex items-center space-x-3">
                            <Checkbox id="chk-bed" checked={checklist.bed} onCheckedChange={(c) => setChecklist(prev => ({ ...prev, bed: !!c }))} />
                            <label htmlFor="chk-bed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Cama / Roupa</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Checkbox id="chk-bath" checked={checklist.bath} onCheckedChange={(c) => setChecklist(prev => ({ ...prev, bath: !!c }))} />
                            <label htmlFor="chk-bath" className="text-sm font-medium leading-none">Banheiro</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Checkbox id="chk-floor" checked={checklist.floor} onCheckedChange={(c) => setChecklist(prev => ({ ...prev, floor: !!c }))} />
                            <label htmlFor="chk-floor" className="text-sm font-medium leading-none">Piso / Aspirador</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Checkbox id="chk-trash" checked={checklist.trash} onCheckedChange={(c) => setChecklist(prev => ({ ...prev, trash: !!c }))} />
                            <label htmlFor="chk-trash" className="text-sm font-medium leading-none">Lixo Retirado</label>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Checkbox id="chk-amenities" checked={checklist.amenities} onCheckedChange={(c) => setChecklist(prev => ({ ...prev, amenities: !!c }))} />
                            <label htmlFor="chk-amenities" className="text-sm font-medium leading-none">Reposição (Frigobar/Amenities)</label>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase text-neutral-500">Observações</Label>
                    <Textarea
                        placeholder="Ex: Torneira pingando, item esquecido..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bg-white border-neutral-200 resize-none h-24"
                    />
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-3">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setSelectedTask(null)}>
                        Cancelar
                    </Button>
                    <Button className="flex-1 h-12 rounded-xl font-bold" onClick={handleSave}>
                        Salvar Atualização
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Governança"
                    subtitle="Limpeza, vistoria e pendências"
                    rightAction={
                        <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                            <button
                                onClick={() => setViewMode('my')}
                                className={cn(
                                    "text-[10px] font-bold px-3 py-1.5 rounded-[6px] transition-all",
                                    viewMode === 'my' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"
                                )}
                            >
                                Minhas
                            </button>
                            <button
                                onClick={() => setViewMode('all')}
                                className={cn(
                                    "text-[10px] font-bold px-3 py-1.5 rounded-[6px] transition-all",
                                    viewMode === 'all' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400"
                                )}
                            >
                                Todas
                            </button>
                        </div>
                    }
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-24 space-y-6">

                {/* HERO KPI */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[24px] p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="relative z-10 grid grid-cols-4 gap-2 text-center">
                        <div className="flex flex-col items-center" onClick={() => { setActiveFilter("dirty"); trackOperation('filter_kpi', 'housekeeping', 'dirty'); }}>
                            <span className="text-2xl font-bold">{kpis.dirty}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Sujos</span>
                        </div>
                        <div className="flex flex-col items-center" onClick={() => { setActiveFilter("cleaning"); trackOperation('filter_kpi', 'housekeeping', 'cleaning'); }}>
                            <span className="text-2xl font-bold">{kpis.cleaning}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Limpando</span>
                        </div>
                        <div className="flex flex-col items-center" onClick={() => { setActiveFilter("inspection"); trackOperation('filter_kpi', 'housekeeping', 'inspection'); }}>
                            <span className="text-2xl font-bold">{kpis.inspect}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Vistoria</span>
                        </div>
                        <div className="flex flex-col items-center" onClick={() => { setActiveFilter("clean"); trackOperation('filter_kpi', 'housekeeping', 'clean'); }}>
                            <span className="text-2xl font-bold">{kpis.clean}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Limpos</span>
                        </div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'dirty', label: 'Sujo' },
                        { id: 'cleaning', label: 'Em Limpeza' },
                        { id: 'inspection', label: 'Vistoria' },
                        { id: 'clean', label: 'Limpo' }
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
                            <PremiumSkeleton key={i} className="h-32 w-full rounded-[20px]" />
                        ))
                    ) : filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                className="bg-white p-5 rounded-[20px] border border-neutral-100 shadow-sm relative overflow-hidden active:scale-[0.99] transition-transform"
                                onClick={() => setSelectedTask(task)} // Opens Sheet
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-bold text-lg">
                                            {task.room?.room_number}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-neutral-800">{task.room?.name || "Quarto"}</h3>
                                            {task.reservation ? (
                                                <p className="text-[11px] text-neutral-500 truncate max-w-[150px]">{task.reservation.guest_name}</p>
                                            ) : (
                                                <p className="text-[11px] text-neutral-400 italic">Sem hóspede</p>
                                            )}
                                        </div>
                                    </div>
                                    <StatusBadge status={task.status} />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-neutral-50">
                                    <div className="flex items-center gap-1.5 text-neutral-400">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-[10px] font-medium">
                                            {format(new Date(task.created_at), "HH:mm")}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm" variant="ghost" className="h-8 px-3 text-xs rounded-full"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/m/rooms/${task.room_id}`);
                                            }}
                                        >
                                            Abrir
                                        </Button>
                                        <Button
                                            size="sm" className="h-8 px-4 text-xs font-bold rounded-full bg-primary/10 text-primary hover:bg-primary/20 shadow-none border border-primary/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTask(task);
                                            }}
                                        >
                                            Atualizar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <CardContainer className="py-12 flex flex-col items-center justify-center text-center bg-neutral-50/50 border-dashed">
                            <div className="h-12 w-12 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                                <Brush className="h-6 w-6 text-neutral-300" />
                            </div>
                            <p className="text-sm font-bold text-neutral-600">Nenhum quarto encontrado</p>
                            <p className="text-xs text-neutral-400">Tente mudar os filtros.</p>
                        </CardContainer>
                    )}
                </div>

            </div>

            {/* UPDATE SHEET */}
            <Sheet open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                <SheetContent side="bottom" className="rounded-t-[32px] p-0 max-h-[90vh]">
                    <SheetHeader className="p-6 pb-2 text-left border-b border-neutral-100">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            Quarto {selectedTask?.room?.room_number}
                            {selectedTask?.priority === 'high' && <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">PRIORIDADE</span>}
                        </SheetTitle>
                        <SheetDescription>
                            Atualize o status e registre itens.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="p-6 overflow-y-auto max-h-[70vh]">
                        <UpdateSheet />
                    </div>
                </SheetContent>
            </Sheet>

        </MobileShell>
    );
};

export default HousekeepingList;
