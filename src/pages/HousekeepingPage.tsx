import { useState } from "react";
import { useHousekeeping } from "@/hooks/useHousekeeping";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useRoomOperation } from "@/hooks/useRoomOperation";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Filter,
    Clock,
    AlertCircle,
    CheckCircle2,
    Droplet,
    X,
    Search,
    BedDouble
} from "lucide-react";
import { Input } from "@/components/ui/input";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // Added useAuth
import { HousekeepingTaskCard } from "@/components/HousekeepingTaskCard";

const HousekeepingPage = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { tasks: queue, isLoading } = useHousekeeping(selectedPropertyId);
    const { updateStatus } = useRoomOperation(selectedPropertyId);
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    const filteredQueue = (queue || []).filter(item =>
        item.room?.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMarkClean = async (roomId: string, currentStatus: string) => {
        if (isViewer) return;
        await updateStatus.mutateAsync({
            roomId,
            newStatus: 'clean',
            oldStatus: currentStatus,
        });
    };

    // Calculate dynamic values for KPIs locally
    const urgentCount = queue?.filter(t => t.priority === 'high').length || 0;
    const dirtyCount = queue?.filter(t => t.room?.status === 'dirty').length || 0;
    const totalQueueCount = queue?.length || 0;

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Sprint 1: Header Premium */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center backdrop-blur-sm border-2 border-amber-500/30">
                                <Sparkles className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Fila de Governança</h1>
                                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    Prioridade de limpeza • Status em tempo real
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="rounded-xl shadow-sm">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtros
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Sprint 2: KPIs Premium */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Saídas Pendentes - Urgente */}
                    <Card className="border-none bg-gradient-to-br from-rose-50 via-rose-50/80 to-rose-100 dark:from-rose-950/50 dark:to-rose-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                                        <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                                            Urgente
                                        </p>
                                    </div>
                                    <p className="text-5xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
                                        {urgentCount}
                                    </p>
                                    <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium">
                                        Saídas pendentes hoje
                                    </p>
                                </div>
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                                    <AlertCircle className="h-8 w-8 text-white drop-shadow-sm" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Sujos */}
                    <Card className="border-none bg-gradient-to-br from-amber-50 via-amber-50/80 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                            Aguardando
                                        </p>
                                    </div>
                                    <p className="text-5xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
                                        {dirtyCount}
                                    </p>
                                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">
                                        Quartos sujos
                                    </p>
                                </div>
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                    <Droplet className="h-8 w-8 text-white drop-shadow-sm" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fila Total */}
                    <Card className="border-none bg-gradient-to-br from-emerald-50 via-emerald-50/80 to-emerald-100 dark:from-emerald-950/50 dark:to-emerald-900/50 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                            Total
                                        </p>
                                    </div>
                                    <p className="text-5xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
                                        {totalQueueCount}
                                    </p>
                                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
                                        Tarefas na fila
                                    </p>
                                </div>
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <CheckCircle2 className="h-8 w-8 text-white drop-shadow-sm" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sprint 3: Search Bar Premium */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar por quarto ou motivo..."
                        className="pl-11 pr-10 h-12 bg-card/50 border-2 focus-visible:border-primary/50 focus-visible:bg-card focus-visible:shadow-lg rounded-xl transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-muted/80 flex items-center justify-center transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Queue List / Sprint 4 & 5 */}
                <div className="space-y-4">
                    {isLoading ? (
                        // Sprint 6: Loading State
                        <DataTableSkeleton rows={5} variant="housekeeping-queue" />
                    ) : filteredQueue.length === 0 ? (
                        // Sprint 5: Premium Empty State
                        // Sprint 5: Premium Empty State
                        <div className="relative py-24 text-center rounded-3xl bg-gradient-to-br from-muted/30 via-muted/10 to-background border-2 border-dashed overflow-hidden mt-6">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 opacity-[0.03]">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                                    backgroundSize: '48px 48px'
                                }} />
                            </div>

                            <div className="relative z-10 space-y-6 px-4">
                                <div className="mx-auto h-20 w-20 rounded-3xl bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center">
                                    <Sparkles className="h-10 w-10 text-emerald-600" />
                                </div>

                                <div className="space-y-2 max-w-md mx-auto">
                                    <h3 className="text-2xl font-bold">Tudo Limpo! 🎉</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Não há tarefas de limpeza pendentes no momento. Todos os quartos estão prontos para receber hóspedes.
                                    </p>
                                </div>

                                <Button
                                    onClick={() => navigate('/operation/rooms')}
                                    variant="outline"
                                    className="rounded-xl shadow-lg hover:shadow-xl transition-all"
                                >
                                    <BedDouble className="mr-2 h-4 w-4" />
                                    Ver Quadro de Quartos
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // Sprint 4: Task Cards
                        filteredQueue.map((item) => (
                            <HousekeepingTaskCard
                                key={item.room.id}
                                task={{
                                    ...item,
                                    room: item.room ? {
                                        id: item.room_id,
                                        room_number: item.room.room_number,
                                        room_types: item.room.room_types || { name: 'Standard' },
                                        status: item.room.status
                                    } : undefined,
                                    reason: item.title || 'Limpeza Geral',
                                    status: item.priority === 'high' ? 'urgent' : 'pending' // Mapping simple status for visual flair
                                }}
                                isViewer={isViewer}
                                onStartCleaning={() => { }} // Placeholder logic for now, standard is directly Mark Clean
                                onCompleteCleaning={() => handleMarkClean(item.room_id, item.room?.status || '')}
                                onViewDetails={() => navigate(`/operation/rooms/${item.room_id}`)}
                            />
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HousekeepingPage;
