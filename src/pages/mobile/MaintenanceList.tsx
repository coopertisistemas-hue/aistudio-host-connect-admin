import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackOperation } from "@/lib/analytics"; // Analytics
import {
    MobileShell,
    MobileTopHeader
} from "@/components/mobile/MobileShell";
import {
    PremiumSkeleton
} from "@/components/mobile/MobileUI";
import { useMaintenance } from "@/hooks/useMaintenance";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { CreateMaintenanceSheet } from "@/components/mobile/CreateMaintenanceSheet";
import {
    Wrench,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Search,
    ChevronRight,
    MapPin,
    Calendar,
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

// Segmented Control Component
const SegmentedControl = ({
    options,
    value,
    onChange
}: {
    options: { label: string; value: string }[];
    value: string;
    onChange: (val: string) => void;
}) => (
    <div className="bg-neutral-100/80 p-1 rounded-xl flex gap-1 w-full relative">
        {options.map((opt) => {
            const isActive = value === opt.value;
            return (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all z-10 relative",
                        isActive ? "text-neutral-800 shadow-sm" : "text-neutral-400 hover:text-neutral-600"
                    )}
                >
                    {opt.label}
                    {isActive && (
                        <div className="absolute inset-0 bg-white rounded-lg -z-10 shadow-sm transition-all animate-in fade-in zoom-in-95 duration-200" />
                    )}
                </button>
            );
        })}
    </div>
);

const MaintenanceList: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { tasks, isLoading, error } = useMaintenance(selectedPropertyId);
    const queryClient = useQueryClient();

    const [activeFilter, setActiveFilter] = useState<string>("open");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.room?.room_number.includes(searchQuery) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

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
                <MobileTopHeader
                    title="Manutenção"
                    subtitle="Chamados e preventivas"
                    showBack={true}
                />
            }
        >
            {/* Main Content Wrapper - Centered & Constrained */}
            <div className="flex flex-col h-full relative z-10 w-full max-w-[420px] mx-auto">

                {/* Fixed Control Bar */}
                <section className="sticky top-[58px] z-30 w-full px-4 pt-4 pb-4 bg-gradient-to-b from-slate-50/90 to-slate-50/80 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all space-y-3">

                    {/* Search */}
                    <div className="relative">
                        <div className="absolute left-4 top-3.5 text-neutral-400">
                            <Search className="h-4 w-4" />
                        </div>
                        <Input
                            placeholder="Buscar chamados..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 pl-10 rounded-xl bg-white border-neutral-200 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-[14px] placeholder:text-neutral-400 shadow-sm"
                        />
                    </div>

                    {/* Segmented Control */}
                    <SegmentedControl
                        options={[
                            { label: "Abertos", value: "open" },
                            { label: "Resolvidos", value: "solved" },
                            { label: "Todos", value: "all" }
                        ]}
                        value={activeFilter}
                        onChange={(val) => {
                            setActiveFilter(val);
                            trackOperation('filter_change', 'maintenance', val);
                        }}
                    />
                </section>

                {/* Task List */}
                <div className="px-5 mt-4 space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+100px)]">
                    {!isLoading && error && (
                        <div className="bg-white border border-dashed border-neutral-200 rounded-2xl p-6 text-center space-y-3">
                            <p className="text-sm font-semibold text-neutral-700">Não foi possível carregar os chamados.</p>
                            <p className="text-xs text-neutral-500">Tente novamente em alguns instantes.</p>
                            <Button
                                variant="outline"
                                className="w-full h-11"
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['maintenance-tasks', selectedPropertyId] })}
                            >
                                Tentar novamente
                            </Button>
                        </div>
                    )}
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <PremiumSkeleton key={i} className="h-32 w-full rounded-2xl bg-white/50" />
                        ))
                    ) : error ? null : filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => {
                            const statusConfig = getStatusConfig(task.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={task.id}
                                    onClick={() => {
                                        trackOperation('view_detail', 'maintenance', task.id);
                                        navigate(`/m/maintenance/${task.id}`);
                                    }}
                                    className="group rounded-2xl p-4 shadow-sm border border-white/60 bg-white hover:bg-neutral-50 active:scale-[0.99] transition-all cursor-pointer relative"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", statusConfig.bg)}>
                                                <StatusIcon className={cn("h-5 w-5", statusConfig.color)} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className={cn(
                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide border",
                                                        getPriorityColor(task.priority)
                                                    )}>
                                                        {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-neutral-800 text-sm line-clamp-1">{task.title}</h3>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                                    </div>

                                    {/* Task Metadata */}
                                    <div className="space-y-1.5 mt-3 pt-3 border-t border-neutral-100">
                                        {task.room && (
                                            <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
                                                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                                                <span>{task.room.room_number}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                                                <span>{format(new Date(task.created_at), "dd MMM 'às' HH:mm", { locale: ptBR })}</span>
                                            </div>

                                            {/* Assignee Avatar */}
                                            {task.assignee ? (
                                                <div className="flex items-center gap-1.5 bg-neutral-100 px-2 py-0.5 rounded-full">
                                                    <span className="text-[10px] font-bold text-neutral-600">Equipe</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 opacity-50">
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span className="text-[10px] italic">Sem resp.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Empty State
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-white to-neutral-50 border border-white/60 shadow-xl flex items-center justify-center mb-6">
                                <CheckCircle2 className="h-8 w-8 text-emerald-300" />
                            </div>
                            <h3 className="text-lg font-black text-neutral-800 mb-1">Tudo certo!</h3>
                            <p className="text-sm text-neutral-400 text-center max-w-[200px] leading-relaxed mb-6">
                                {searchQuery
                                    ? "Nenhum chamado encontrado para sua busca."
                                    : activeFilter === 'all'
                                        ? "Não há chamados registrados."
                                        : "Nenhum chamado nesta categoria."}
                            </p>
                            {/* If filter/search is active, show clear button */}
                            {(searchQuery || activeFilter !== 'all') && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSearchQuery(""); setActiveFilter("all"); }}
                                    className="text-emerald-600 font-bold hover:bg-emerald-50"
                                >
                                    Limpar filtros
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Floating "New Ticket" Button is managed by the Sheet Trigger */}
                <CreateMaintenanceSheet />
            </div>
        </MobileShell>
    );
};

export default MaintenanceList;
