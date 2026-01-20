import React from 'react';
import { MobileShell, MobileTopHeader } from '@/components/mobile/MobileShell';
import { useParams, useNavigate } from 'react-router-dom';
import { useRooms } from '@/hooks/useRooms';
import { useRoomOperation, RoomOperationalStatus } from '@/hooks/useRoomOperation';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useBookings } from '@/hooks/useBookings';
import { useFolio } from '@/hooks/useFolio';
import {
    ErrorState,
    PremiumSkeleton,
} from '@/components/mobile/MobileUI';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    BedDouble,
    Sparkles,
    CheckCircle2,
    AlertTriangle,
    Ban,
    User,
    Calendar,
    Wallet,
    Wrench,
    UtensilsCrossed
} from 'lucide-react';
import { RoomStatusBadge } from '@/components/RoomStatusBadge';
import { CreateConsumptionSheet } from '@/components/mobile/CreateConsumptionSheet';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { BookingStatus } from '@/lib/constants/statuses';

const MobileRoomDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { rooms, isLoading: loadingRooms } = useRooms(selectedPropertyId);
    const { updateStatus } = useRoomOperation(selectedPropertyId);

    // 1. Fetch Room Data
    const room = rooms.find(r => r.id === id);

    // 2. Fetch Active Booking
    // We filter client-side for now, or could use an RPC "get_active_booking_by_room"
    const { bookings, isLoading: loadingBookings } = useBookings();

    const activeBooking = bookings.find(b =>
        b.current_room_id === id &&
        (b.status === BookingStatus.RESERVED || b.status === BookingStatus.CHECKED_IN)
        // Optional: Date check, but status usually implies occupancy
    );

    // 3. Fetch Folio Calculation (if occupied)
    const { totals, isLoading: loadingFolio } = useFolio(activeBooking?.id);

    const isLoading = loadingRooms || loadingBookings || (!!activeBooking && loadingFolio);

    if (isLoading) {
        return (
            <MobileShell header={<MobileTopHeader />}>
                <div className="p-5 space-y-4">
                    <PremiumSkeleton className="h-40 w-full" />
                    <PremiumSkeleton className="h-24 w-full" />
                    <PremiumSkeleton className="h-20 w-full" />
                </div>
            </MobileShell>
        );
    }

    if (!room) {
        return (
            <MobileShell header={<MobileTopHeader />}>
                <ErrorState message="Quarto não encontrado." onRetry={() => navigate(-1)} />
            </MobileShell>
        );
    }

    const handleStatusChange = async (newStatus: string) => {
        try {
            await updateStatus.mutateAsync({
                roomId: room.id,
                newStatus: newStatus as RoomOperationalStatus,
                oldStatus: room.status,
                reason: "Alterado via Mobile Cockpit"
            });
        } catch (error) {
            console.error(error);
        }
    };

    // Calculate Long Stay
    const stayDuration = activeBooking
        ? differenceInDays(new Date(), new Date(activeBooking.check_in))
        : 0;
    const isLongStay = stayDuration > 15;

    // Helper for Big Action Buttons
    const ActionButton: React.FC<{
        label: string;
        subLabel?: string;
        icon: React.ElementType;
        colorClass: string;
        onClick: () => void;
        isActive?: boolean;
    }> = ({ label, subLabel, icon: Icon, colorClass, onClick, isActive }) => (
        <button
            onClick={onClick}
            disabled={isActive}
            className={`
                w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98]
                ${isActive
                    ? 'bg-neutral-100 border-neutral-200 cursor-default opacity-50'
                    : 'bg-white border-neutral-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-neutral-200'
                }
            `}
        >
            <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${colorClass} bg-opacity-10`}>
                    <Icon className={`h-5 w-5 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-sm text-neutral-800">{label}</h3>
                    {subLabel && <p className="text-xs font-medium text-neutral-400">{subLabel}</p>}
                </div>
            </div>
            {isActive && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
        </button>
    );

    return (
        <MobileShell
            header={
                <div className="h-[60px] flex items-center px-4 bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-20">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-neutral-100 active:bg-neutral-200 transition-colors mr-2"
                    >
                        <ArrowLeft className="h-5 w-5 text-neutral-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-bold text-neutral-900 leading-none">Quarto {room.room_number}</h1>
                        <p className="text-xs font-medium text-neutral-400 mt-0.5">{room.room_types?.name}</p>
                    </div>
                    <RoomStatusBadge status={room.status as any} />
                </div>
            }
        >
            <div className="p-5 space-y-6 pb-24">

                {/* 1. Guest Context Card (Cockpit Header) */}
                {activeBooking ? (
                    <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm relative overflow-hidden">
                        {isLongStay && (
                            <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                Mensalista ({stayDuration} dias)
                            </div>
                        )}

                        <div className="flex items-start gap-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-neutral-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-neutral-900 truncate max-w-[200px]">{activeBooking.guest_name}</h2>
                                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(activeBooking.check_in), 'dd/MM', { locale: ptBR })} - {format(new Date(activeBooking.check_out), 'dd/MM', { locale: ptBR })}
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between border border-neutral-100">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Parcial Conta</span>
                            </div>
                            <span className="text-lg font-bold text-neutral-900">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals?.balance || 0)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100 text-center flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-white border border-neutral-100 flex items-center justify-center mb-3">
                            <BedDouble className="h-6 w-6 text-neutral-300" />
                        </div>
                        <h3 className="font-bold text-neutral-900">Quarto Vago</h3>
                        <p className="text-xs text-neutral-400 mt-1">Nenhum hóspede vinculado no momento.</p>
                    </div>
                )}

                {/* 2. Cockpit Actions: Consumption & Reporting */}
                {activeBooking && (
                    <div className="grid grid-cols-2 gap-3">
                        <CreateConsumptionSheet
                            bookingId={activeBooking.id}
                            roomNumber={room.room_number}
                            guestName={activeBooking.guest_name}
                            trigger={
                                <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm active:scale-[0.98] transition-all hover:border-emerald-200 group">
                                    <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <UtensilsCrossed className="h-5 w-5" />
                                    </div>
                                    <span className="font-bold text-sm text-neutral-800">Lançar Consumo</span>
                                </button>
                            }
                        />

                        <button
                            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-neutral-100 shadow-sm active:scale-[0.98] transition-all hover:border-amber-200 group"
                            onClick={() => toast.info("Funcionalidade de Ocorrência em breve")}
                        >
                            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <Wrench className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-sm text-neutral-800">Manutenção</span>
                        </button>
                    </div>
                )}

                {/* 3. Housekeeping Status Control */}
                <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1 mb-3">Governança</p>
                    <div className="space-y-3">
                        <ActionButton
                            label="Limpo"
                            subLabel="Quarto pronto"
                            icon={CheckCircle2}
                            colorClass="bg-blue-500 text-blue-600"
                            isActive={room.status === 'clean'}
                            onClick={() => handleStatusChange('clean')}
                        />
                        <ActionButton
                            label="Sujo"
                            subLabel="Precisa de limpeza"
                            icon={Sparkles}
                            colorClass="bg-amber-500 text-amber-600"
                            isActive={room.status === 'dirty'}
                            onClick={() => handleStatusChange('dirty')}
                        />
                        <ActionButton
                            label="Vistoriado"
                            subLabel="Inspecionado"
                            icon={CheckCircle2}
                            colorClass="bg-emerald-500 text-emerald-600"
                            isActive={room.status === 'inspected'}
                            onClick={() => handleStatusChange('inspected')}
                        />
                    </div>
                </div>

                {/* 4. Other Issues */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                        onClick={() => handleStatusChange('maintenance')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all
                            ${room.status === 'maintenance' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-neutral-100 text-neutral-500'}
                        `}
                    >
                        <AlertTriangle className="h-4 w-4" />
                        Manutenção (Status)
                    </button>
                    <button
                        onClick={() => handleStatusChange('ooo')}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all
                            ${room.status === 'ooo' ? 'bg-neutral-100 border-neutral-300 text-neutral-800' : 'bg-white border-neutral-100 text-neutral-500'}
                        `}
                    >
                        <Ban className="h-4 w-4" />
                        Bloquear (OOO)
                    </button>
                </div>

            </div>
        </MobileShell>
    );
};

export default MobileRoomDetail;
