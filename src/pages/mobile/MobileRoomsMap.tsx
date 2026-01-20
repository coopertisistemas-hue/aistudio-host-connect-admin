import React, { useState, useMemo, useEffect } from 'react';
import { MobileShell, MobileTopHeader } from '@/components/mobile/MobileShell';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useRooms, Room } from '@/hooks/useRooms';
import { useBookings } from '@/hooks/useBookings';
import {
    PremiumSkeleton,
    ErrorState
} from '@/components/mobile/MobileUI';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Search,
    BedDouble,
    Sparkles,
    CheckCircle2,
    User,
    Ban,
    Filter,
    Calendar,
    AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RoomStatusBadge } from '@/components/RoomStatusBadge';
import { differenceInDays } from 'date-fns';
import { BookingStatus } from '@/lib/constants/statuses';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription
} from "@/components/ui/sheet";
import {
    MoreVertical,
    Trash2,
    PlusCircle,
    Wrench,
    Siren
} from "lucide-react";
import { toast } from "sonner";

// Helper for status chips with icons
interface StatusChipProps {
    label: string;
    value: string;
    isActive: boolean;
    count: number;
    onClick: () => void;
}

const StatusChip = ({ label, value, isActive, count, onClick }: StatusChipProps) => (
    <button
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border
            ${isActive
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-md scale-105'
                : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:border-neutral-300'
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

const MobileRoomsMap = () => {
    // AUDIT LOG
    console.info("[Rooms] render MobileRoomsMap");

    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { rooms, isLoading: loadingRooms, error: roomsError } = useRooms(selectedPropertyId);
    const { bookings, isLoading: loadingBookings, error: bookingsError } = useBookings();

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Quick Actions State
    const [selectedRoomForActions, setSelectedRoomForActions] = useState<Room | null>(null);

    // Robust Loading State
    const [loadTimeout, setLoadTimeout] = useState(false);

    // Timeout Protection (12s rule - increased for safety)
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (loadingRooms || loadingBookings) {
            timer = setTimeout(() => {
                setLoadTimeout(true);
            }, 12000);
        }
        return () => clearTimeout(timer);
    }, [loadingRooms, loadingBookings]);

    // Log errors for debugging
    useEffect(() => {
        if (roomsError) console.error("Rooms Error:", roomsError);
        if (bookingsError) console.warn("Bookings Error (Soft Fail):", bookingsError);
    }, [roomsError, bookingsError]);

    // Active Loading: Only if API is working, no timeout, and no CRITICAL error (rooms error)
    // We ignore bookingsError for the loading state to allow "Soft Fail"
    const isLoading = (loadingRooms || loadingBookings) && !loadTimeout && !roomsError;

    // Map active bookings to rooms
    const roomBookingMap = useMemo(() => {
        // If bookings failed or are null, return empty map (Soft Fail)
        if (!bookings || bookingsError) return new Map();

        const map = new Map();
        bookings.forEach(b => {
            if ((b.status === BookingStatus.RESERVED || b.status === BookingStatus.CHECKED_IN) && b.current_room_id) {
                map.set(b.current_room_id, b);
            }
        });
        return map;
    }, [bookings, bookingsError]);

    // Derived State: Filtered Rooms
    const filteredRooms = useMemo(() => {
        if (!rooms || roomsError) return [];

        return rooms.filter((room) => {
            const booking = roomBookingMap.get(room.id);
            const guestName = booking?.guest_name || "";

            // Search Logic
            const matchesSearch =
                room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                room.room_types?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                guestName.toLowerCase().includes(searchQuery.toLowerCase());

            // Filter Logic
            if (statusFilter === 'all') return matchesSearch;

            if (statusFilter === 'long_stay') {
                if (!booking) return false;
                const days = differenceInDays(new Date(), new Date(booking.check_in));
                return matchesSearch && days > 15;
            }

            if (statusFilter === 'occupied') {
                return matchesSearch && (room.status === 'occupied' || !!booking);
            }

            if (statusFilter === 'vacant') {
                return matchesSearch && room.status !== 'occupied' && !booking;
            }

            return matchesSearch && room.status === statusFilter;
        });
    }, [rooms, roomBookingMap, searchQuery, statusFilter, roomsError]);

    // Helper to count for chips
    const getCount = (filterValue: string) => {
        if (!rooms) return 0;
        if (filterValue === 'all') return rooms.length;

        return rooms.filter(r => {
            const booking = roomBookingMap.get(r.id);
            if (filterValue === 'long_stay') {
                return booking && differenceInDays(new Date(), new Date(booking.check_in)) > 15;
            }
            if (filterValue === 'occupied') return r.status === 'occupied' || !!booking;
            if (filterValue === 'vacant') return r.status !== 'occupied' && !booking;
            return r.status === filterValue;
        }).length;
    };

    const filters = [
        { label: "Todos", value: "all" },
        { label: "Ocupado", value: "occupied" },
        { label: "Vago", value: "vacant" },
        { label: "Sujo", value: "dirty" },
        { label: "Limpo", value: "clean" },
        { label: "Vistoriado", value: "inspected" },
        { label: "Manutenção", value: "maintenance" },
        { label: "Bloqueado", value: "ooo" },
        { label: "Mensalista", value: "long_stay" },
    ];

    // ERROR STATE: Timeout OR Critical API Error (Rooms)
    // We do NOT block on bookingsError anymore.
    const hasCriticalError = roomsError || loadTimeout;

    // Mock Action Handlers
    const handleQuickAction = (action: string, room: Room) => {
        setSelectedRoomForActions(null); // Close sheet
        setTimeout(() => {
            const booking = roomBookingMap.get(room.id);
            const guest = booking ? ` para ${booking.guest_name}` : "";

            if (action === "cleaning") toast.success(`Limpeza registrada no quarto ${room.room_number}`);
            if (action === "consumption") toast.success(`Consumo adicionado${guest}`);
            if (action === "maintenance") toast.success(`Chamado de manutenção aberto: ${room.room_number}`);
            if (action === "incident") toast.error(`Incidente reportado à governança!`);
        }, 200);
    };

    if (hasCriticalError) {
        return (

            <MobileShell header={
                <MobileTopHeader
                    showBack={true}
                    title="Quartos"
                    subtitle="Mapa de ocupação e status"
                />
            }>
                <div className="flex flex-col h-full bg-neutral-50/50 items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center mb-4 ring-4 ring-rose-50/50">
                        <AlertTriangle className="h-10 w-10 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-neutral-800 mb-2">Ops, algo deu errado.</h2>
                    <p className="text-sm text-neutral-500 text-center mb-6 max-w-[250px]">
                        {loadTimeout
                            ? "O carregamento demorou muito. Verifique sua conexão."
                            : "Não conseguimos carregar a lista de quartos."}
                    </p>
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                        <Button
                            onClick={() => window.location.reload()}
                            className="bg-neutral-900 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-neutral-900/10 active:scale-95 transition-all w-full"
                        >
                            Tentar novamente
                        </Button>
                        {roomsError && (
                            <p className="text-[10px] text-rose-400 text-center font-mono mt-2 bg-rose-50 p-2 rounded border border-rose-100 break-all">
                                {roomsError.message || "Erro desconhecido"}
                            </p>
                        )}
                    </div>
                </div>
            </MobileShell>
        );
    }

    return (
        <MobileShell header={
            <MobileTopHeader
                showBack={true}
                title="Quartos"
                subtitle="Mapa de ocupação e status"
            />
        }>
            {/* Main Content Wrapper - Centered & Constrained */}
            <div className="flex flex-col h-full relative z-10 w-full max-w-[420px] mx-auto">

                {/* Search & Filter - Docked Glass Bar */}
                {/* Visual: "Integrated" with header but distinct. Less "floating card", more "sub-bar" */}
                <section className="sticky top-[58px] z-30 w-full px-4 pt-4 pb-2 bg-gradient-to-b from-slate-50/90 to-slate-50/80 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all">
                    <div className="relative">
                        {/* Search Input */}
                        <div className="relative mb-3">
                            <div className="absolute left-4 top-3.5 text-neutral-400">
                                <Search className="h-4 w-4" />
                            </div>
                            <Input
                                placeholder="Buscar quarto ou hóspede..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-11 pl-10 rounded-xl bg-white border-neutral-200 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-[15px] placeholder:text-neutral-400 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
                            />
                        </div>

                        {/* Chips Carousel */}
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
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
                </section>

                {/* Manager Alerts Block - Executive Summary */}
                <div className="px-5 mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 border border-indigo-100/50 shadow-sm flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-0.5">Longo Prazo</span>
                            <span className="text-xs font-semibold text-neutral-600 leading-tight">Acima de 7 dias</span>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                            <span className="text-sm font-black text-indigo-600">
                                {bookings ? bookings.filter(b => b.status === BookingStatus.CHECKED_IN && differenceInDays(new Date(), new Date(b.check_in)) > 7).length : 0}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 border border-purple-100/50 shadow-sm flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-0.5">Mensalistas</span>
                            <span className="text-xs font-semibold text-neutral-600 leading-tight">Ativos hoje</span>
                        </div>
                        <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center border border-purple-100">
                            <span className="text-sm font-black text-purple-600">
                                {bookings ? bookings.filter(b => b.status === BookingStatus.CHECKED_IN && differenceInDays(new Date(), new Date(b.check_in)) > 15).length : 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content List */}
                <div className="px-5 mt-3 space-y-3 pb-[calc(env(safe-area-inset-bottom,0px)+140px)]">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <PremiumSkeleton key={i} className="h-32 w-full rounded-3xl bg-white/50" />
                        ))
                    ) : rooms?.length === 0 ? (
                        // TRUE EMPTY STATE (No rooms at all)
                        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                            <div className="h-24 w-24 rounded-full bg-neutral-100 border border-neutral-200 shadow-inner flex items-center justify-center mb-6">
                                <Ban className="h-10 w-10 text-neutral-400" />
                            </div>
                            <h3 className="text-lg font-black text-neutral-800 mb-1">Nenhum quarto encontrado</h3>
                            <p className="text-sm text-neutral-400 text-center max-w-[250px] leading-relaxed mb-6">
                                Não há quartos cadastrados ou a integração não retornou dados.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                                className="rounded-xl border-neutral-200 text-neutral-600 font-bold"
                            >
                                Verificar integração
                            </Button>
                        </div>
                    ) : filteredRooms.length === 0 ? (
                        // FILTER EMPTY STATE (No match for search/filter)
                        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-white to-neutral-50 border border-white/60 shadow-xl flex items-center justify-center mb-6">
                                <BedDouble className="h-10 w-10 text-neutral-300" />
                            </div>
                            <h3 className="text-lg font-black text-neutral-800 mb-1">Nenhum quarto disponível</h3>
                            <p className="text-sm text-neutral-400 text-center max-w-[200px] leading-relaxed">
                                Não encontramos quartos para os filtros selecionados.
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                                className="mt-4 text-emerald-600 font-bold hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            >
                                Limpar filtros
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3"> {/* FORCE 1 COLUMN */}
                            {filteredRooms.map((room) => (
                                <RoomMobileCard
                                    key={room.id}
                                    room={room}
                                    booking={roomBookingMap.get(room.id)}
                                    onClick={() => navigate(`/m/rooms/${room.id}`)}
                                    onOpenActions={(e) => {
                                        e.stopPropagation();
                                        setSelectedRoomForActions(room);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* QUICK ACTIONS SHEET */}
            <Sheet open={!!selectedRoomForActions} onOpenChange={() => setSelectedRoomForActions(null)}>
                <SheetContent side="bottom" className="rounded-t-[32px] p-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">
                    <SheetHeader className="mb-6 text-left">
                        <SheetTitle className="text-xl font-bold flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                                <BedDouble className="h-4 w-4 text-neutral-600" />
                            </div>
                            Quarto {selectedRoomForActions?.room_number}
                        </SheetTitle>
                        <SheetDescription>
                            Selecione uma ação rápida para este quarto.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-24 flex-col gap-2 rounded-2xl border-neutral-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all font-bold text-neutral-600 shadow-sm"
                            onClick={() => selectedRoomForActions && handleQuickAction("cleaning", selectedRoomForActions)}
                        >
                            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Sparkles className="h-5 w-5 text-emerald-600" />
                            </div>
                            Limpeza
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 flex-col gap-2 rounded-2xl border-neutral-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all font-bold text-neutral-600 shadow-sm"
                            onClick={() => selectedRoomForActions && handleQuickAction("consumption", selectedRoomForActions)}
                        >
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <PlusCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            Consumo
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 flex-col gap-2 rounded-2xl border-neutral-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all font-bold text-neutral-600 shadow-sm"
                            onClick={() => selectedRoomForActions && handleQuickAction("maintenance", selectedRoomForActions)}
                        >
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <Wrench className="h-5 w-5 text-orange-600" />
                            </div>
                            Manutenção
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 flex-col gap-2 rounded-2xl border-neutral-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-all font-bold text-neutral-600 shadow-sm"
                            onClick={() => selectedRoomForActions && handleQuickAction("incident", selectedRoomForActions)}
                        >
                            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                                <Siren className="h-5 w-5 text-rose-600" />
                            </div>
                            Incidente
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

        </MobileShell>
    );
};

// Sub-component: Room Card (Enhanced)
const RoomMobileCard: React.FC<{
    room: Room;
    booking?: any;
    onClick: () => void;
    onOpenActions: (e: React.MouseEvent) => void;
}> = ({ room, booking, onClick, onOpenActions }) => {
    // Determine visuals based on status
    const getStatusVisuals = (status: string) => {
        switch (status) {
            case 'dirty': return { border: 'border-l-4 border-l-amber-500', icon: Sparkles, iconClass: 'text-amber-600 bg-amber-100', bg: 'bg-amber-50/50' };
            case 'clean': return { border: 'border-l-4 border-l-emerald-500', icon: Sparkles, iconClass: 'text-emerald-600 bg-emerald-100', bg: 'bg-emerald-50/50' };
            case 'inspected': return { border: 'border-l-4 border-l-blue-500', icon: CheckCircle2, iconClass: 'text-blue-600 bg-blue-100', bg: 'bg-blue-50/50' };
            case 'occupied': return { border: 'border-l-4 border-l-rose-500', icon: User, iconClass: 'text-rose-600 bg-rose-100', bg: 'bg-rose-50/50' };
            case 'ooo': return { border: 'border-l-4 border-l-neutral-500', icon: Ban, iconClass: 'text-neutral-500 bg-neutral-200', bg: 'bg-neutral-50' };
            case 'maintenance': return { border: 'border-l-4 border-l-orange-500', icon: AlertTriangle, iconClass: 'text-orange-600 bg-orange-100', bg: 'bg-orange-50/50' };
            default: return { border: 'border-l-4 border-l-neutral-300', icon: BedDouble, iconClass: 'text-neutral-500 bg-neutral-100', bg: 'bg-white' };
        }
    };

    const visuals = getStatusVisuals(room.status);
    const StatusIcon = visuals.icon;

    // Mensalista Calculation
    const stayDuration = booking ? differenceInDays(new Date(), new Date(booking.check_in)) : 0;
    const isLongStay = stayDuration > 15;

    return (
        <div
            onClick={onClick}
            className={`
                rounded-2xl p-4 shadow-sm border border-white/60 
                active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden group hover:shadow-md
                ${visuals.bg} ${visuals.border}
            `}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${visuals.iconClass} shadow-sm`}>
                        <StatusIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black text-neutral-800 leading-none tracking-tight">{room.room_number}</h3>
                            {isLongStay && (
                                <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                    Mensalista
                                </span>
                            )}
                        </div>
                        <p className="text-xs font-bold text-neutral-500 mt-1 line-clamp-1 opacity-80 uppercase tracking-wider">{room.room_types?.name}</p>
                    </div>
                </div>

                {/* Right Side: Badge + More Options */}
                <div className="flex flex-col items-end gap-2">
                    <RoomStatusBadge status={room.status as any} className="shadow-sm" />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mr-2 rounded-full hover:bg-black/5 text-neutral-400"
                        onClick={onOpenActions}
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Guest Context Info - Only if Occupied or has Booking */}
            {booking ? (
                <div className="mt-3 pt-3 border-t border-neutral-900/5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-neutral-500" />
                        <span className="text-[15px] font-bold text-neutral-800 truncate">
                            {booking.guest_name}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 pl-0.5 text-xs text-neutral-500 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                            há <strong className="text-neutral-800">{stayDuration} dias</strong> na casa
                        </span>
                    </div>
                </div>
            ) : room.status === 'occupied' ? (
                // Fallback for Occupied but no booking data (Data mismatch or delay)
                <div className="mt-3 pt-3 border-t border-neutral-900/5 flex items-center gap-2 text-xs font-bold text-rose-500">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Ocupado (Dados indisponíveis)</span>
                </div>
            ) : null}

            {/* Governance/Maintenance Context - If NOT occupied but has status specific info could go here */}
            {/* For now, just the top status is enough, but we could add "Cleaned by Maria at 10:00" later */}

        </div>
    );
};

export default MobileRoomsMap;
