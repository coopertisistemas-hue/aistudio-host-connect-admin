import { useState } from "react";
import { useHousekeeping } from "@/hooks/useHousekeeping";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { useRoomOperation } from "@/hooks/useRoomOperation";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    Brush,
    ArrowRight,
    Search,
    Filter,
    Sparkles
} from "lucide-react";
import { RoomStatusBadge } from "@/components/RoomStatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { Input } from "@/components/ui/input";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { useNavigate } from "react-router-dom";

const HousekeepingPage = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { queue, kpis, isLoading } = useHousekeeping(selectedPropertyId);
    const { updateStatus } = useRoomOperation(selectedPropertyId);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();


    const filteredQueue = (queue || []).filter(item =>
        item.room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMarkClean = async (roomId: string, currentStatus: string) => {
        await updateStatus.mutateAsync({
            roomId,
            newStatus: 'clean',
            oldStatus: currentStatus,
        });
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header & KPIs */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Fila de Governança</h1>
                        <p className="text-muted-foreground text-sm">Prioridade de limpeza e status em tempo real</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Card className="border-none bg-rose-50 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-bold text-rose-600">{kpis?.urgentCheckouts || 0}</span>
                                <span className="text-[10px] uppercase font-bold text-rose-400">Saídas Pendentes</span>
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-amber-50 shadow-sm">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <span className="text-2xl font-bold text-amber-600">{kpis?.backlogCount || 0}</span>
                                <span className="text-[10px] uppercase font-bold text-amber-400">Total Sujos</span>
                            </CardContent>
                        </Card>
                        <Card className="border-none bg-emerald-50 shadow-sm hidden md:flex">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center w-full">
                                <span className="text-2xl font-bold text-emerald-600">{queue?.length || 0}</span>
                                <span className="text-[10px] uppercase font-bold text-emerald-400">Fila Total</span>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por quarto ou motivo..."
                        className="pl-10 h-11 bg-card shadow-sm border-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Queue List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <DataTableSkeleton />
                    ) : filteredQueue.length === 0 ? (
                        <div className="py-20 text-center bg-card rounded-xl border border-dashed flex flex-col items-center">
                            <Sparkles className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                            <p className="text-muted-foreground text-sm">Tudo limpo por aqui! Ou nenhum resultado.</p>
                        </div>
                    ) : (
                        filteredQueue.map((item) => (
                            <Card
                                key={item.room.id}
                                className={`overflow-hidden border-none shadow-sm transition-all ${item.room.status === 'dirty' ? 'bg-card' : 'bg-muted/30 opacity-80'
                                    }`}
                            >
                                <CardContent className="p-0">
                                    <div className="flex items-stretch min-h-[90px]">
                                        {/* Priority Bar */}
                                        <div className={`w-1.5 ${item.priority === 'high' ? 'bg-rose-500' :
                                            item.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                                            }`} />

                                        <div className="flex-1 p-4 flex items-center justify-between gap-4">
                                            <div className="flex-1 flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                                                    <span className="text-xl font-bold">{item.room.room_number}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <PriorityBadge priority={item.priority} />
                                                        <RoomStatusBadge status={item.room.status as any} className="h-4 text-[9px] px-1.5" />
                                                    </div>
                                                    <p className="text-xs font-medium text-foreground">{item.reason}</p>
                                                    <p className="text-[10px] text-muted-foreground">{item.room.room_types?.name}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {item.room.status === 'dirty' ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-500 hover:bg-emerald-600 h-10 px-4"
                                                        onClick={() => handleMarkClean(item.room.id, item.room.status)}
                                                    >
                                                        <Brush className="h-4 w-4 mr-2" />
                                                        Limpar
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 px-4 text-primary"
                                                        onClick={() => navigate(`/operation/rooms/${item.room.id}`)}
                                                    >
                                                        Detalhes
                                                        <ArrowRight className="h-4 w-4 ml-2" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default HousekeepingPage;
