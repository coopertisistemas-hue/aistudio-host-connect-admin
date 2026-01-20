import { useState } from "react";
import { useDemands } from "@/hooks/useDemands";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Wrench,
    Plus,
    Search,
    Filter,
    AlertTriangle,
    Construction,
    Clock,
    X,
    CheckCircle2,
    Check,
    Hammer
} from "lucide-react";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { DemandDialog } from "@/components/DemandDialog";
import DashboardLayout from "@/components/DashboardLayout";
import { MaintenanceTaskCard } from "@/components/MaintenanceTaskCard";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // Added useAuth

const DemandsPage = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { demands, isLoading, createDemand } = useDemands(selectedPropertyId);
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const navigate = useNavigate();

    const handleCreateDemand = async (data: any) => {
        if (isViewer) return;
        const room_id = data.room_id === 'none' ? null : data.room_id;
        await createDemand.mutateAsync({ ...data, room_id });
        setDialogOpen(false);
    };

    const filteredDemands = (demands || []).filter((demand) => {
        const matchesSearch = demand.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            demand.rooms?.room_number?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || demand.status === statusFilter ||
            (statusFilter === 'open' && (demand.status === 'todo' || demand.status === 'waiting'));
        return matchesSearch && matchesStatus;
    });

    const kpis = {
        open: (demands || []).filter(d => d.status === 'todo' || d.status === 'waiting').length,
        critical: (demands || []).filter(d => d.priority === 'critical' && d.status !== 'done').length,
        inProgress: (demands || []).filter(d => d.status === 'in-progress').length,
    };

    const filters = [
        { label: "Todas", value: "all" },
        { label: "Em Aberto", value: "open" },
        { label: "Em Execução", value: "in-progress" },
        { label: "Concluídas", value: "done" },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Sprint 1: Premium Header */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center backdrop-blur-sm border-2 border-orange-500/30">
                                <Hammer className="h-6 w-6 text-orange-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Manutenção</h1>
                                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    Operação em Tempo Real • Demandas e Reparos
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {!isViewer && (
                                <Button
                                    className="rounded-xl shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all hover:-translate-y-0.5"
                                    onClick={() => setDialogOpen(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nova Demanda
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sprint 2: Glassmorphism KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Abertas */}
                    <Card className="border-none bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default group relative">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-amber-500/20" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Em Aberto
                                    </p>
                                    <p className="text-5xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
                                        {kpis.open}
                                    </p>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
                                        Aguardando atendimento
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <Construction className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Críticas */}
                    <Card className="border-none bg-gradient-to-br from-rose-50 via-rose-50/80 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default group relative">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-rose-500/20" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Críticas
                                    </p>
                                    <p className="text-5xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
                                        {kpis.critical}
                                    </p>
                                    <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium">
                                        Prioridade máxima
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                                    <AlertTriangle className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Em Execução */}
                    <Card className="border-none bg-gradient-to-br from-blue-50 via-blue-50/80 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default group relative">
                        <div className="absolute right-0 top-0 h-32 w-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/20" />
                        <CardContent className="p-6 relative z-10">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                        <Wrench className="h-4 w-4" />
                                        Em Execução
                                    </p>
                                    <p className="text-5xl font-black text-blue-700 dark:text-blue-300 tracking-tight">
                                        {kpis.inProgress}
                                    </p>
                                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">
                                        Sendo resolvidas agora
                                    </p>
                                </div>
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Clock className="h-7 w-7 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sprint 3: Search & Filters */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative group flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Buscar por título, quarto ou categoria..."
                                className="pl-11 pr-10 h-12 bg-card/50 border-2 focus-visible:border-primary/50 focus-visible:bg-card focus-visible:shadow-lg rounded-xl transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-muted/80 flex items-center justify-center transition-colors"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2 p-1 bg-muted/30 rounded-xl overflow-x-auto scrollbar-hide">
                            {filters.map((filter) => {
                                const isActive = statusFilter === filter.value;
                                return (
                                    <button
                                        key={filter.value}
                                        onClick={() => setStatusFilter(filter.value)}
                                        className={`
                                            px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                            ${isActive
                                                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm scale-105 font-semibold'
                                                : 'text-muted-foreground hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-foreground'
                                            }
                                        `}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Sprint 4 & 5: Content List & Empty State */}
                {isLoading ? (
                    <DataTableSkeleton rows={6} variant="maintenance" />
                ) : filteredDemands.length === 0 ? (
                    // Sprint 5: Celebratory Empty State
                    <div className="relative py-24 text-center rounded-3xl bg-gradient-to-br from-muted/30 via-muted/10 to-background border-2 border-dashed overflow-hidden mt-6">
                        <div className="absolute inset-0 opacity-[0.03]">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                                backgroundSize: '48px 48px'
                            }} />
                        </div>

                        <div className="relative z-10 space-y-6 px-4">
                            <div className="mx-auto h-20 w-20 rounded-3xl bg-orange-500/10 backdrop-blur-sm flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-orange-600" />
                            </div>

                            <div className="space-y-2 max-w-md mx-auto">
                                <h3 className="text-2xl font-bold">Tudo em Ordem! 🛠️</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Nenhuma demanda de manutenção encontrada com os filtros atuais.
                                </p>
                            </div>

                            <Button
                                onClick={() => isViewer ? navigate('/operation/rooms') : setDialogOpen(true)}
                                className="rounded-xl shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all"
                            >
                                {isViewer ? (
                                    <>
                                        <Hammer className="mr-2 h-4 w-4" />
                                        Ver Quadro de Quartos
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Abrir Nova Demanda
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Sprint 4: Premium Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDemands.map((demand) => (
                            <MaintenanceTaskCard
                                key={demand.id}
                                demand={demand}
                                onClick={() => navigate(`/operation/demands/${demand.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <DemandDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleCreateDemand}
                isLoading={createDemand.isPending}
                propertyId={selectedPropertyId}
            />
        </DashboardLayout>
    );
};

export default DemandsPage;
