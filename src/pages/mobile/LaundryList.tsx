import React, { useState, useMemo } from "react";
import {
    WashingMachine,
    Filter,
    Plus,
    Clock,
    CheckCircle2,
    ArrowRight,
    Shirt,
    ArrowUpRight,
    Search
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- Mock Data & Types ---
interface LaundryTask {
    id: string;
    room: string;
    items: string;
    status: 'pending' | 'washing' | 'ready' | 'delivered';
    created_at: Date;
    notes?: string;
    priority?: boolean;
}

const mockLaundryTasks: LaundryTask[] = [
    { id: '1', room: '101', items: '2 Toalhas Banho, 1 Rosto', status: 'pending', created_at: new Date(Date.now() - 1000 * 60 * 30), priority: true },
    { id: '2', room: '205', items: 'Lençol Casal, Fronhas', status: 'washing', created_at: new Date(Date.now() - 1000 * 60 * 120) },
    { id: '3', room: '304', items: 'Toalha Piscina', status: 'ready', created_at: new Date(Date.now() - 1000 * 60 * 240) },
];

const LaundryList: React.FC = () => {
    // --- Local State for Pilot ---
    const [tasks, setTasks] = useState<LaundryTask[]>(mockLaundryTasks);
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [isNewSheetOpen, setIsNewSheetOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<LaundryTask | null>(null);

    // --- Derived Data ---
    const kpis = useMemo(() => {
        return {
            pending: tasks.filter(t => t.status === 'pending').length,
            washing: tasks.filter(t => t.status === 'washing').length,
            ready: tasks.filter(t => t.status === 'ready').length,
            delivered: tasks.filter(t => t.status === 'delivered').length
        };
    }, [tasks]);

    const filteredTasks = useMemo(() => {
        if (activeFilter === 'all') return tasks;
        return tasks.filter(t => t.status === activeFilter);
    }, [tasks, activeFilter]);

    // --- Actions ---
    const handleCreate = (data: { room: string, items: string, notes: string }) => {
        const newTask: LaundryTask = {
            id: Math.random().toString(36).substr(2, 9),
            room: data.room,
            items: data.items,
            status: 'pending',
            created_at: new Date(),
            notes: data.notes,
            priority: false
        };
        setTasks([newTask, ...tasks]);
        setIsNewSheetOpen(false);
    };

    const handleUpdateStatus = (taskId: string, newStatus: LaundryTask['status']) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        setSelectedTask(null);
    };

    // --- Components ---
    const NewRequestSheet = () => {
        const [room, setRoom] = useState("");
        const [items, setItems] = useState("");
        const [notes, setNotes] = useState("");

        return (
            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label>Quarto / Origem</Label>
                    <Input placeholder="Ex: 101 ou Recepção" value={room} onChange={e => setRoom(e.target.value)} className="h-12 rounded-xl" autoFocus />
                </div>
                <div className="space-y-2">
                    <Label>Itens</Label>
                    <Input placeholder="Ex: 2 toalhas, 1 lençol" value={items} onChange={e => setItems(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea placeholder="Opcional" value={notes} onChange={e => setNotes(e.target.value)} className="h-20 rounded-xl resize-none" />
                </div>
                <Button
                    className="w-full h-12 rounded-xl mt-4 font-bold text-md"
                    onClick={() => handleCreate({ room, items, notes })}
                    disabled={!room || !items}
                >
                    Registrar Solicitação
                </Button>
            </div>
        );
    };

    const UpdateStatusSheet = ({ task }: { task: LaundryTask }) => {
        const steps: { status: LaundryTask['status'], label: string, icon: any }[] = [
            { status: 'pending', label: 'Pendente', icon: Clock },
            { status: 'washing', label: 'Em Lavagem', icon: WashingMachine },
            { status: 'ready', label: 'Pronto / Passado', icon: Shirt },
            { status: 'delivered', label: 'Entregue', icon: CheckCircle2 },
        ];

        return (
            <div className="space-y-6 pt-4">
                <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 mb-6">
                    <p className="text-xs font-bold text-neutral-400 uppercase">Itens</p>
                    <p className="text-base font-medium text-neutral-800">{task.items}</p>
                    {task.notes && <p className="text-sm text-neutral-500 mt-2 italic">"{task.notes}"</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {steps.map((step) => (
                        <button
                            key={step.status}
                            onClick={() => handleUpdateStatus(task.id, step.status)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all h-24",
                                task.status === step.status
                                    ? "bg-primary/5 border-primary text-primary ring-1 ring-primary"
                                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                            )}
                        >
                            <step.icon className={cn("h-6 w-6", task.status === step.status ? "text-primary" : "text-neutral-400")} />
                            <span className="text-xs font-bold uppercase">{step.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <MobileShell
            header={
                <MobilePageHeader
                    title="Lavanderia"
                    subtitle="Fila de lavagem e enxoval"
                    rightAction={
                        <Button
                            size="icon"
                            className="bg-primary hover:bg-primary/90 rounded-full h-8 w-8 shadow-md"
                            onClick={() => setIsNewSheetOpen(true)}
                        >
                            <Plus className="h-5 w-5 text-white" />
                        </Button>
                    }
                />
            }
        >
            <div className="px-[var(--ui-spacing-page,20px)] pb-24 space-y-6">

                {/* HERO KPI */}
                <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[24px] p-5 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="relative z-10 grid grid-cols-4 gap-2 text-center">
                        <div className="flex flex-col items-center" onClick={() => setActiveFilter("pending")}>
                            <span className="text-2xl font-bold">{kpis.pending}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Fila</span>
                        </div>
                        <div className="flex flex-col items-center" onClick={() => setActiveFilter("washing")}>
                            <span className="text-2xl font-bold">{kpis.washing}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Lavando</span>
                        </div>
                        <div className="flex flex-col items-center" onClick={() => setActiveFilter("ready")}>
                            <span className="text-2xl font-bold">{kpis.ready}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Pronto</span>
                        </div>
                        <div className="flex flex-col items-center" onClick={() => setActiveFilter("delivered")}>
                            <span className="text-2xl font-bold">{kpis.delivered}</span>
                            <span className="text-[9px] uppercase font-bold opacity-80">Entregue</span>
                        </div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {[
                        { id: 'all', label: 'Todas' },
                        { id: 'pending', label: 'Pendentes' },
                        { id: 'washing', label: 'Lavando' },
                        { id: 'ready', label: 'Prontos' },
                        { id: 'delivered', label: 'Entregues' }
                    ].map(filter => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                activeFilter === filter.id
                                    ? "bg-neutral-900 text-white border-neutral-900"
                                    : " bg-white text-neutral-500 border-neutral-100"
                            )}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* TASK LIST */}
                <div className="space-y-3">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden active:scale-[0.99] transition-transform cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-neutral-100 px-2 py-1 rounded-md text-xs font-bold text-neutral-600">
                                            {task.room}
                                        </div>
                                        {task.priority && (
                                            <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-bold">
                                                URGENTE
                                            </span>
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                        task.status === 'pending' ? "bg-neutral-100 text-neutral-500" :
                                            task.status === 'washing' ? "bg-blue-100 text-blue-600" :
                                                task.status === 'ready' ? "bg-emerald-100 text-emerald-600" :
                                                    "bg-neutral-100 text-neutral-400"
                                    )}>
                                        {task.status === 'pending' ? 'Fila' :
                                            task.status === 'washing' ? 'Lavando' :
                                                task.status === 'ready' ? 'Pronto' : 'Entregue'}
                                    </span>
                                </div>

                                <h4 className="text-sm font-bold text-neutral-800 mb-1">{task.items}</h4>

                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-dashed border-neutral-100">
                                    <div className="flex items-center gap-1 text-neutral-400 text-[11px]">
                                        <Clock className="h-3 w-3" />
                                        <span>{format(task.created_at, "HH:mm")}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-primary text-xs font-bold">
                                        Atualizar <ArrowRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
                            <WashingMachine className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma solicitação encontrada.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* NEW TASK SHEET */}
            <Sheet open={isNewSheetOpen} onOpenChange={setIsNewSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-[32px]">
                    <SheetHeader>
                        <SheetTitle>Nova Solicitação</SheetTitle>
                        <SheetDescription>Registre itens para lavagem.</SheetDescription>
                    </SheetHeader>
                    <NewRequestSheet />
                </SheetContent>
            </Sheet>

            {/* UPDATE TASK SHEET */}
            <Sheet open={!!selectedTask} onOpenChange={(o) => !o && setSelectedTask(null)}>
                <SheetContent side="bottom" className="rounded-t-[32px]">
                    <SheetHeader>
                        <SheetTitle className="flex justify-between items-center pr-8">
                            <span>Quarto {selectedTask?.room}</span>
                        </SheetTitle>
                        <SheetDescription>Atualize o status do processo.</SheetDescription>
                    </SheetHeader>
                    {selectedTask && <UpdateStatusSheet task={selectedTask} />}
                </SheetContent>
            </Sheet>

        </MobileShell>
    );
};

export default LaundryList;
