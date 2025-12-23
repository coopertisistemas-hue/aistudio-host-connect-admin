import React, { useState } from "react";
import {
    CalendarDays,
    Users,
    Search,
    ChevronRight,
    MapPin,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Home,
    BedDouble,
    CheckCircle2,
    DollarSign,
    CreditCard
} from "lucide-react";
import {
    MobileShell,
    MobileTopHeader
} from "@/components/mobile/MobileShell";
import {
    PremiumSkeleton
} from "@/components/mobile/MobileUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMobileReservations, BookingSummary } from "@/hooks/useMobileReservations";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

// --- Components ---

const StatBlock = ({ label, value, icon: Icon, color }: any) => (
    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <Icon className={cn("h-4 w-4 mb-1", color)} />
        <span className="text-lg font-bold text-white leading-none">{value}</span>
        <span className="text-[9px] text-white/60 uppercase font-medium mt-0.5">{label}</span>
    </div>
);

const ReservationCard = ({ booking, onClick }: { booking: BookingSummary, onClick: () => void }) => {
    const isLongStay = differenceInDays(new Date(booking.check_out), new Date(booking.check_in)) >= 7;
    const isTodayArrival = new Date(booking.check_in).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    const isTodayDeparture = new Date(booking.check_out).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

    return (
        <div
            onClick={onClick}
            className="group rounded-2xl p-4 shadow-sm border border-white/60 bg-white hover:bg-neutral-50 active:scale-[0.99] transition-all cursor-pointer relative"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                        <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                            {isTodayArrival && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                    CHEGA HOJE
                                </Badge>
                            )}
                            {isTodayDeparture && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-rose-50 text-rose-700 border-rose-200">
                                    SAI HOJE
                                </Badge>
                            )}
                            {!isTodayArrival && !isTodayDeparture && (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                                    EM CASA
                                </Badge>
                            )}
                            {isLongStay && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">LONG STAY</Badge>
                            )}
                        </div>
                        <h3 className="font-bold text-neutral-800 text-sm line-clamp-1">{booking.guest_name}</h3>
                    </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
            </div>

            <div className="space-y-1.5 mt-3 pt-3 border-t border-neutral-100">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-neutral-600 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{booking.room?.room_number || "Sem quarto"} <span className="text-neutral-300 mx-1">|</span> {booking.room?.name || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                        <Users className="h-3 w-3" />
                        <span>{booking.total_guests}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    <span>{format(new Date(booking.check_in), "dd/MM")} - {format(new Date(booking.check_out), "dd/MM")} ({differenceInDays(new Date(booking.check_out), new Date(booking.check_in))}n)</span>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

const MobileReservations: React.FC = () => {
    const { selectedPropertyId } = useSelectedProperty();
    const { stats, lists, isLoading } = useMobileReservations(selectedPropertyId);

    const [activeFilter, setActiveFilter] = useState<string>("today"); // today | in_house | arrivals | departures
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBooking, setSelectedBooking] = useState<BookingSummary | null>(null);

    // Consolidated List Generation
    const getDisplayList = () => {
        let baseList: BookingSummary[] = [];

        // "Today" combines Arrivals and Departures for a quick view
        if (activeFilter === 'today') {
            baseList = [...lists.arrivals, ...lists.departures];
        } else if (activeFilter === 'in_house') {
            baseList = lists.inHouse;
        } else if (activeFilter === 'arrivals') {
            baseList = lists.arrivals;
        } else if (activeFilter === 'departures') {
            baseList = lists.departures;
        }

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return baseList.filter(b =>
                b.guest_name.toLowerCase().includes(query) ||
                b.room?.room_number.includes(query)
            );
        }

        return baseList;
    };

    const displayList = getDisplayList();

    const renderEmptyState = () => (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-white to-neutral-50 border border-white/60 shadow-xl flex items-center justify-center mb-6">
                <CalendarDays className="h-8 w-8 text-indigo-300" />
            </div>
            <h3 className="text-lg font-black text-neutral-800 mb-1">Agenda Livre</h3>
            <p className="text-sm text-neutral-400 text-center max-w-[200px] leading-relaxed mb-6">
                {searchQuery
                    ? "Nenhuma reserva encontrada para sua busca."
                    : "Nenhuma atividade de reserva encontrada para este filtro."}
            </p>
            {(searchQuery || activeFilter !== 'today') && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSearchQuery(""); setActiveFilter("today"); }}
                    className="text-indigo-600 font-bold hover:bg-indigo-50"
                >
                    Limpar filtros
                </Button>
            )}
        </div>
    );

    return (
        <MobileShell
            header={
                <MobileTopHeader
                    title="Reservas"
                    subtitle="Acompanhamento do dia"
                    showBack={true}
                />
            }
        >
            <div className="flex flex-col h-full relative z-10 w-full max-w-[420px] mx-auto pb-[calc(env(safe-area-inset-bottom,0px)+20px)]">

                {/* Hero / Day Summary */}
                <div className="px-4 pt-4 pb-2">
                    <div className="rounded-3xl p-5 bg-neutral-900 text-white shadow-xl shadow-neutral-900/20 relative overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl -ml-5 -mb-5" />

                        <div className="relative z-10 flex gap-6 items-center mb-6">
                            <div className="flex-1">
                                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest block mb-1">Ocupação Hoje</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black tracking-tight">{stats.occupancyRate.toFixed(0)}%</span>
                                    <span className="text-xs font-medium text-white/60">ocupado</span>
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/10 min-w-[100px] text-center">
                                <span className="block text-2xl font-bold">{stats.totalRooms - stats.occupiedRooms}</span>
                                <span className="text-[9px] font-bold text-white/60 uppercase tracking-wide">Vagos</span>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-4 gap-2 relative z-10">
                            <div onClick={() => setActiveFilter('today')} className={cn("cursor-pointer transition-opacity", activeFilter !== 'today' && "opacity-50")}>
                                <StatBlock icon={Calendar} label="Agenda" value={lists.arrivals.length + lists.departures.length} color="text-yellow-400" />
                            </div>
                            <div onClick={() => setActiveFilter('arrivals')} className={cn("cursor-pointer transition-opacity", activeFilter !== 'arrivals' && "opacity-50")}>
                                <StatBlock icon={ArrowDownLeft} label="Chegadas" value={stats.arrivalsToday} color="text-emerald-400" />
                            </div>
                            <div onClick={() => setActiveFilter('departures')} className={cn("cursor-pointer transition-opacity", activeFilter !== 'departures' && "opacity-50")}>
                                <StatBlock icon={ArrowUpRight} label="Saídas" value={stats.departuresToday} color="text-rose-400" />
                            </div>
                            <div onClick={() => setActiveFilter('in_house')} className={cn("cursor-pointer transition-opacity", activeFilter !== 'in_house' && "opacity-50")}>
                                <StatBlock icon={Home} label="Em Casa" value={stats.occupiedRooms} color="text-blue-400" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="sticky top-[58px] z-30 px-4 py-2 bg-gradient-to-b from-slate-50/90 to-slate-50/80 backdrop-blur-xl border-b border-white/50 space-y-2">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                        <Input
                            placeholder="Buscar hóspede ou quarto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-10 pl-10 rounded-xl bg-white border-neutral-200 focus:border-indigo-300 focus:ring-indigo-500/10 text-sm font-medium shadow-sm"
                        />
                    </div>
                    {/* Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
                        {[
                            { id: 'today', label: 'Hoje' },
                            { id: 'in_house', label: 'Hóspedes' },
                            { id: 'arrivals', label: 'Chegadas' },
                            { id: 'departures', label: 'Saídas' }
                        ].map(chip => (
                            <button
                                key={chip.id}
                                onClick={() => setActiveFilter(chip.id)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                                    activeFilter === chip.id
                                        ? "bg-neutral-800 text-white border-neutral-800 shadow-md"
                                        : "bg-white text-neutral-500 border-neutral-200"
                                )}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content List */}
                <div className="px-4 py-4 space-y-3 min-h-[300px]">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <PremiumSkeleton key={i} className="h-28 w-full rounded-2xl bg-white/50" />
                        ))
                    ) : displayList.length > 0 ? (
                        displayList.map(booking => (
                            <ReservationCard
                                key={booking.id}
                                booking={booking}
                                onClick={() => setSelectedBooking(booking)}
                            />
                        ))
                    ) : (
                        renderEmptyState()
                    )}
                </div>
            </div>

            {/* Detail Sheet */}
            <Sheet open={!!selectedBooking} onOpenChange={(o) => !o && setSelectedBooking(null)}>
                <SheetContent side="bottom" className="rounded-t-[32px] max-h-[85vh] overflow-y-auto p-0 border-t-0">
                    {selectedBooking && (
                        <div>
                            <SheetHeader className="p-6 pb-2 text-left bg-neutral-50/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline" className="bg-white text-neutral-500 border-neutral-200">
                                        #{selectedBooking.id.slice(0, 6)}
                                    </Badge>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                                        selectedBooking.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                                    )}>
                                        {selectedBooking.status}
                                    </span>
                                </div>
                                <SheetTitle className="text-2xl font-black text-neutral-800 leading-tight">
                                    {selectedBooking.guest_name}
                                </SheetTitle>
                                <SheetDescription className="text-neutral-500 font-medium flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {selectedBooking.room?.name || "Sem quarto atribuído"}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="p-6 space-y-6">
                                {/* Stay Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Check-in</span>
                                        <span className="text-lg font-bold text-neutral-800 block">
                                            {format(new Date(selectedBooking.check_in), "dd MMM")}
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            {format(new Date(selectedBooking.check_in), "HH:mm")}
                                        </span>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase block mb-1">Check-out</span>
                                        <span className="text-lg font-bold text-neutral-800 block">
                                            {format(new Date(selectedBooking.check_out), "dd MMM")}
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            {format(new Date(selectedBooking.check_out), "HH:mm")}
                                        </span>
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100/50 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            <CreditCard className="h-4 w-4" />
                                        </div>
                                        <h4 className="font-bold text-indigo-900">Resumo Financeiro</h4>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-indigo-100/50">
                                        <span className="text-sm text-neutral-600">Total da Reserva</span>
                                        <span className="text-lg font-bold text-neutral-800">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBooking.total_amount || 0)}
                                        </span>
                                    </div>

                                    {/* Placeholder for Alerts */}
                                    {differenceInDays(new Date(selectedBooking.check_out), new Date(selectedBooking.check_in)) >= 7 && (
                                        <div className="flex gap-2 p-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-medium border border-yellow-100">
                                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                                            <p>Estadia longa detectada (&gt;7 dias). Verifique parciais.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Info Block */}
                                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 text-center">
                                    <p className="text-xs text-neutral-400">
                                        Para editar esta reserva ou lançar pagamentos, acesse o painel administrativo completo.
                                    </p>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full h-12 rounded-xl font-bold border-neutral-200"
                                    onClick={() => setSelectedBooking(null)}
                                >
                                    Fechar Detalhes
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </MobileShell>
    );
};

export default MobileReservations;
