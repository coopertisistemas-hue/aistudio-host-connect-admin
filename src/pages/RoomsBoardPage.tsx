import { useState } from "react";
import { useRooms } from "@/hooks/useRooms";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import DashboardLayout from "@/components/DashboardLayout";
import { RoomOperationCard } from "@/components/RoomOperationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { RoomOperationalStatus } from "@/hooks/useRoomOperation";

const RoomsBoardPage = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { rooms, isLoading } = useRooms(selectedPropertyId);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filteredRooms = rooms.filter((room) => {
        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.room_types?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || room.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statuses: { label: string; value: string; count: number }[] = [
        { label: "Todos", value: "all", count: rooms.length },
        { label: "Sujo", value: "dirty", count: rooms.filter(r => r.status === 'dirty').length },
        { label: "Limpo", value: "clean", count: rooms.filter(r => r.status === 'clean').length },
        { label: "Inspecionado", value: "inspected", count: rooms.filter(r => r.status === 'inspected').length },
        { label: "Ocupado", value: "occupied", count: rooms.filter(r => r.status === 'occupied').length },
        { label: "OOO", value: "ooo", count: rooms.filter(r => r.status === 'ooo').length },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Quadro de Quartos</h1>
                        <p className="text-muted-foreground text-sm">Operação de Governança e Status</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Search and Quick Filters */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por número ou tipo..."
                            className="pl-10 h-11 bg-card"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {statuses.map((s) => (
                            <Badge
                                key={s.value}
                                variant={statusFilter === s.value ? "default" : "secondary"}
                                className={`cursor-pointer px-4 py-1.5 text-xs font-medium transition-all ${statusFilter === s.value ? "shadow-md scale-105" : "hover:bg-secondary/80"
                                    }`}
                                onClick={() => setStatusFilter(s.value)}
                            >
                                {s.label} ({s.count})
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Board Content */}
                {isLoading ? (
                    <DataTableSkeleton />
                ) : filteredRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-dashed text-center px-4">
                        <Filter className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Nenhum quarto encontrado</h3>
                        <p className="text-muted-foreground text-sm mt-1">Tente ajustar seus filtros ou busca.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRooms.map((room) => (
                            <RoomOperationCard key={room.id} room={room} />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default RoomsBoardPage;
