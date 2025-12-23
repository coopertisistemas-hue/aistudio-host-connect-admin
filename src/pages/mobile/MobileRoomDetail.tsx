import React from 'react';
import { MobileShell, MobileTopHeader } from '@/components/mobile/MobileShell';
import { useParams, useNavigate } from 'react-router-dom';
import { useRooms, Room } from '@/hooks/useRooms';
import { useRoomOperation, RoomOperationalStatus } from '@/hooks/useRoomOperation';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import {
    ErrorState,
    PremiumSkeleton,
    CardContainer
} from '@/components/mobile/MobileUI';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    BedDouble,
    Sparkles,
    CheckCircle2,
    Play,
    History,
    AlertTriangle,
    Ban
} from 'lucide-react';
import { RoomStatusBadge } from '@/components/RoomStatusBadge';
import { toast } from 'sonner';

const MobileRoomDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { selectedPropertyId } = useSelectedProperty();
    const { rooms, isLoading } = useRooms(selectedPropertyId);
    const { updateStatus } = useRoomOperation(selectedPropertyId);

    const room = rooms.find(r => r.id === id);

    if (isLoading) {
        return (
            <MobileShell header={<MobileTopHeader title="Detalhe do Quarto" />}>
                <div className="p-5 space-y-4">
                    <PremiumSkeleton className="h-40 w-full" />
                    <PremiumSkeleton className="h-20 w-full" />
                    <PremiumSkeleton className="h-20 w-full" />
                </div>
            </MobileShell>
        );
    }

    if (!room) {
        return (
            <MobileShell header={<MobileTopHeader title="Não encontrado" />}>
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
                reason: "Alterado via Mobile"
            });
            // Toast is handled in the hook, but we can do haptic feedback here if native
            // Optional: navigate back automatically or stay? Staying is better on detail.
        } catch (error) {
            console.error(error);
        }
    };

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
                w-full flex items-center justify-between p-5 rounded-2xl border transition-all active:scale-[0.98]
                ${isActive
                    ? 'bg-neutral-100 border-neutral-200 cursor-default opacity-50'
                    : 'bg-white border-neutral-100 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:border-neutral-200'
                }
            `}
        >
            <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-lg text-neutral-800">{label}</h3>
                    {subLabel && <p className="text-sm font-medium text-neutral-400">{subLabel}</p>}
                </div>
            </div>
            {isActive && <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Atual</span>}
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
            <div className="p-5 space-y-6 pb-12">

                {/* Hero Status Indicator */}
                <div className="text-center py-6 bg-white rounded-3xl border border-neutral-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neutral-200 to-transparent opacity-50"></div>
                    <BedDouble className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-1">Status Atual</p>
                    <h2 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center justify-center gap-2">
                        {room.status === 'dirty' && "Sujo"}
                        {room.status === 'clean' && "Limpo"}
                        {room.status === 'inspected' && "Vistoriado"}
                        {room.status === 'occupied' && "Ocupado"}
                        {room.status === 'maintenance' && "Manutenção"}
                        {room.status === 'ooo' && "Fora de Ordem"}
                        {room.status === 'available' && "Disponível"}
                    </h2>
                </div>

                {/* Operations Section */}
                <div className="space-y-4">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Ações Operacionais</p>

                    {/* State Transitions */}
                    <ActionButton
                        label="Sujo"
                        subLabel="Marcar para limpeza"
                        icon={Sparkles}
                        colorClass="bg-amber-500 text-amber-600"
                        isActive={room.status === 'dirty'}
                        onClick={() => handleStatusChange('dirty')}
                    />

                    <ActionButton
                        label="Limpo"
                        subLabel="Limpeza finalizada"
                        icon={CheckCircle2}
                        colorClass="bg-blue-500 text-blue-600"
                        isActive={room.status === 'clean'}
                        onClick={() => handleStatusChange('clean')}
                    />

                    <ActionButton
                        label="Vistoriado"
                        subLabel="Pronto para check-in"
                        icon={CheckCircle2}
                        colorClass="bg-emerald-500 text-emerald-600"
                        isActive={room.status === 'inspected'}
                        onClick={() => handleStatusChange('inspected')}
                    />
                </div>

                {/* Issues Section */}
                <div className="space-y-4 pt-4">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider ml-1">Problemas & Bloqueios</p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleStatusChange('maintenance')}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border bg-white shadow-sm active:scale-[0.98] transition-all
                                ${room.status === 'maintenance' ? 'border-rose-500 bg-rose-50' : 'border-neutral-100 hover:border-neutral-200'}
                            `}
                        >
                            <AlertTriangle className={`h-6 w-6 mb-2 ${room.status === 'maintenance' ? 'text-rose-600' : 'text-rose-500'}`} />
                            <span className="font-bold text-sm text-neutral-800">Manutenção</span>
                        </button>

                        <button
                            onClick={() => handleStatusChange('ooo')}
                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border bg-white shadow-sm active:scale-[0.98] transition-all
                                ${room.status === 'ooo' ? 'border-neutral-800 bg-neutral-100' : 'border-neutral-100 hover:border-neutral-200'}
                             `}
                        >
                            <Ban className="h-6 w-6 mb-2 text-neutral-600" />
                            <span className="font-bold text-sm text-neutral-800">Bloquear (OOO)</span>
                        </button>
                    </div>
                </div>

                {/* Log Button */}
                <div className="pt-4">
                    <Button variant="outline" className="w-full h-12 rounded-xl text-neutral-500 font-bold border-dashed border-2">
                        <History className="h-4 w-4 mr-2" />
                        Ver Histórico do Quarto
                    </Button>
                </div>

            </div>
        </MobileShell>
    );
};

export default MobileRoomDetail;
