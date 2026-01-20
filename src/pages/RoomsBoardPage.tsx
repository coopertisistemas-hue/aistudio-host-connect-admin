import { useState } from "react";
import { useRooms } from "@/hooks/useRooms";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import DashboardLayout from "@/components/DashboardLayout";
import { RoomOperationCard } from "@/components/RoomOperationCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, LayoutGrid, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { RoomStatus, getRoomStatusLabel } from '@/lib/constants/statuses';

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
        { label: getRoomStatusLabel(RoomStatus.DIRTY), value: RoomStatus.DIRTY, count: rooms.filter(r => r.status === RoomStatus.DIRTY).length },
        { label: getRoomStatusLabel(RoomStatus.CLEAN), value: RoomStatus.CLEAN, count: rooms.filter(r => r.status === RoomStatus.CLEAN).length },
        { label: getRoomStatusLabel(RoomStatus.INSPECTED), value: RoomStatus.INSPECTED, count: rooms.filter(r => r.status === RoomStatus.INSPECTED).length },
        { label: "Ocupado", value: "occupied", count: rooms.filter(r => r.status === 'occupied').length },
        { label: "OOO", value: "ooo", count: rooms.filter(r => r.status === 'ooo').length },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Sprint 1: Header Premium */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center backdrop-blur-sm">
                                <LayoutGrid className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Quadro de Quartos</h1>
                                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                                    Operação ao vivo • Governança
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="px-3 py-1.5 font-semibold">
                                {rooms.length} {rooms.length === 1 ? 'Quarto' : 'Quartos'}
                            </Badge>
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Search and Quick Filters */}
                <div className="space-y-4">
                    {/* Sprint 2: Search Bar Premium */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar por número ou tipo de quarto..."
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

                    {/* Sprint 3: Status Badges Premium */}
                    <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 scrollbar-none">
                        {statuses.map((s) => {
                            const isActive = statusFilter === s.value;

                            const badgeStyles = {
                                all: isActive
                                    ? "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/30"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300",
                                dirty: isActive
                                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30"
                                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400",
                                clean: isActive
                                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400",
                                inspected: isActive
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400",
                                occupied: isActive
                                    ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-400",
                                ooo: isActive
                                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                                    : "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-400",
                            };

                            return (
                                <button
                                    key={s.value}
                                    onClick={() => setStatusFilter(s.value)}
                                    className={`
                                        inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold
                                        transition-all duration-300 cursor-pointer border-2
                                        ${isActive ? 'scale-105 border-transparent' : 'border-transparent hover:scale-102 hover:shadow-md'}
                                        ${badgeStyles[s.value as keyof typeof badgeStyles]}
                                    `}
                                >
                                    <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-white/90 animate-pulse' : 'bg-current opacity-50'
                                        }`} />
                                    <span>{s.label}</span>
                                    <span className={isActive ? 'opacity-90' : 'opacity-60'}>·</span>
                                    <span className="font-black">{s.count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Board Content */}
                {isLoading ? (
                    // Sprint 6: Premium Loading
                    <DataTableSkeleton rows={6} variant="room-grid" />
                ) : filteredRooms.length === 0 ? (
                    // Sprint 5: Premium Empty State
                    <div className="relative py-24 text-center rounded-3xl bg-gradient-to-br from-muted/30 via-muted/10 to-background border-2 border-dashed overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-[0.03]">
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                                backgroundSize: '48px 48px'
                            }} />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="mx-auto h-20 w-20 rounded-3xl bg-primary/10 backdrop-blur-sm flex items-center justify-center">
                                <Filter className="h-10 w-10 text-primary" />
                            </div>

                            <div className="space-y-2 max-w-md mx-auto px-4">
                                <h3 className="text-xl font-bold">Nenhum quarto encontrado</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Tente ajustar seus filtros de status ou refinar a busca por número ou tipo de quarto.
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery("");
                                    setStatusFilter("all");
                                }}
                                className="rounded-xl shadow-sm hover:shadow-md transition-all"
                            >
                                Limpar Filtros
                            </Button>
                        </div>
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
