import React, { useState } from 'react';
import { MobileShell, MobileTopHeader } from '@/components/mobile/MobileShell';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useRooms, Room } from '@/hooks/useRooms';
import {
    CardContainer,
    ErrorState,
    PremiumSkeleton
} from '@/components/mobile/MobileUI';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Search,
    BedDouble,
    Sparkles,
    CheckCircle2,
    User,
    Ban,
    Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoomStatusBadge } from '@/components/RoomStatusBadge';

// Helper for status chips with icons
const StatusChip: React.FC<{
    label: string;
    value: string;
    isActive: boolean;
    count: number;
    onClick: () => void;
}> = ({ label, value, isActive, count, onClick }) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap
            ${isActive
                ? 'bg-neutral-900 text-white shadow-lg scale-105'
                : 'bg-white border border-neutral-100 text-neutral-500 hover:bg-neutral-50'
            }
        `}
    >
        {label}
        <span className={`
            ml-1 px-1.5 py-0.5 rounded-full text-[10px] 
            ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-400'}
        `}>
            {count}
        </span>
    </button>
);

const MobileRoomsMap: React.FC = () => {
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { rooms, isLoading, error } = useRooms(selectedPropertyId);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Filter Logic
    const filteredRooms = rooms.filter((room) => {
        const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.room_types?.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = statusFilter === "all" || room.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Counts for chips
    const getCount = (status: string) => status === 'all'
        ? rooms.length
        : rooms.filter(r => r.status === status).length;

    const filters = [
        { label: "Todos", value: "all" },
        { label: "Sujo", value: "dirty" },
        { label: "Limpo", value: "clean" },
        { label: "Vistoriado", value: "inspected" },
        { label: "Ocupado", value: "occupied" },
        { label: "OOO", value: "ooo" },
    ];

    if (error) {
        return (
            <MobileShell header={<MobileTopHeader title="Mapa de Quartos" />}>
                <ErrorState message="Não foi possível carregar os quartos." onRetry={() => window.location.reload()} />
            </MobileShell>
        );
    }

    return (
        <MobileShell header={<MobileTopHeader title="Mapa de Quartos" />}>
            <div className="flex flex-col h-full bg-neutral-50/50">

                {/* Search & Filter Header (Sticky) */}
                <div className="sticky top-[70px] z-10 bg-white/95 backdrop-blur-md pt-4 pb-2 px-5 border-b border-neutral-100 shadow-sm">
                    {/* Search */}
                    <div className="relative mb-4">
                        <div className="absolute left-4 top-3.5 text-neutral-400">
                            <Search className="h-4 w-4" />
                        </div>
                        <Input
                            placeholder="Buscar quarto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 pl-10 rounded-2xl bg-neutral-50 border-neutral-100 focus:bg-white transition-all font-medium text-[15px]"
                        />
                    </div>

                    {/* Chips Carousel */}
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
                        {filters.map(f => (
                            <StatusChip
                                key={f.value}
                                label={f.label}
                                value={f.value}
                                count={getCount(f.value)}
                                isActive={statusFilter === f.value}
                                onClick={() => setStatusFilter(f.value)}
                            />
                        ))}
                    </div>
                </div>

                {/* Content List */}
                <div className="p-5 space-y-3 min-h-[calc(100vh-180px)]">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <PremiumSkeleton key={i} className="h-24 w-full" />
                        ))
                    ) : filteredRooms.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <Filter className="h-10 w-10 mb-3 text-neutral-300" />
                            <p className="font-medium text-neutral-400">Nenhum quarto encontrado</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredRooms.map((room) => (
                                <RoomMobileCard key={room.id} room={room} onClick={() => navigate(`/m/rooms/${room.id}`)} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MobileShell>
    );
};

// Sub-component: Room Card
const RoomMobileCard: React.FC<{ room: Room; onClick: () => void }> = ({ room, onClick }) => {
    // Determine visuals based on status
    const getStatusVisuals = (status: string) => {
        switch (status) {
            case 'dirty': return { border: 'border-l-4 border-l-amber-500', icon: Sparkles, iconClass: 'text-amber-500 bg-amber-50' };
            case 'clean': return { border: 'border-l-4 border-l-blue-500', icon: Sparkles, iconClass: 'text-blue-500 bg-blue-50' };
            case 'inspected': return { border: 'border-l-4 border-l-emerald-500', icon: CheckCircle2, iconClass: 'text-emerald-500 bg-emerald-50' };
            case 'occupied': return { border: 'border-l-4 border-l-rose-500', icon: User, iconClass: 'text-rose-500 bg-rose-50' };
            case 'ooo': return { border: 'border-l-4 border-l-neutral-500', icon: Ban, iconClass: 'text-neutral-500 bg-neutral-100' };
            default: return { border: 'border-l-4 border-l-neutral-300', icon: BedDouble, iconClass: 'text-neutral-400 bg-neutral-50' };
        }
    };

    const visuals = getStatusVisuals(room.status);
    const StatusIcon = visuals.icon;

    return (
        <div
            onClick={onClick}
            className={`
                bg-white rounded-2xl p-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] border border-neutral-100 
                active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden
                ${visuals.border}
            `}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${visuals.iconClass}`}>
                        <StatusIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-neutral-800 leading-none">{room.room_number}</h3>
                        <p className="text-xs font-medium text-neutral-400 mt-1 line-clamp-1">{room.room_types?.name}</p>
                    </div>
                </div>
                {/* Badge component reused */}
                <RoomStatusBadge status={room.status as any} />
            </div>

            {/* Context info (optional, e.g. guest name if occupied) could go here */}
            {room.status === 'occupied' && (
                <div className="mt-2 pt-2 border-t border-neutral-50 flex items-center gap-1.5 text-xs font-semibold text-rose-500">
                    <User className="h-3 w-3" />
                    <span>Hóspede na casa</span>
                </div>
            )}
        </div>
    );
};

export default MobileRoomsMap;
