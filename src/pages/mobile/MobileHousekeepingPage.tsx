import { useState, useMemo } from 'react';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useOrg } from '@/hooks/useOrg';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { useUpdateRoomStatus, RoomStatus, getStatusLabel, getStatusVariant } from '@/hooks/useUpdateRoomStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useProperties } from '@/hooks/useProperties';
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner';
import { Loader2, Home, Filter, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmptyState } from '@/components/onboarding/EmptyState';
import { Building2, Search, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileHousekeepingPage = () => {
    const { selectedPropertyId, setSelectedPropertyId } = useSelectedProperty();
    const { properties, isLoading: propertiesLoading } = useProperties();
    const { currentOrgId } = useOrg();
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all');

    // Fetch rooms for selected property
    const { rooms, isLoading: roomsLoading } = useRooms(selectedPropertyId);
    const updateRoomStatus = useUpdateRoomStatus();

    // Filter rooms by status
    const filteredRooms = useMemo(() => {
        if (statusFilter === 'all') return rooms;
        return rooms.filter(room => room.status === statusFilter);
    }, [rooms, statusFilter]);

    // Loading state
    if (propertiesLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
            </div>
        );
    }

    // No properties at all
    if (properties.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <EmptyState
                    icon={Building2}
                    title="Configuração inicial pendente"
                    description="Para começar, crie sua primeira propriedade e seus quartos."
                    primaryAction={!isViewer ? {
                        label: "Ir para configuração inicial",
                        onClick: () => navigate("/setup")
                    } : undefined}
                />
            </div>
        );
    }

    // No property selected
    if (!selectedPropertyId) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Home className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Selecione uma Propriedade</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    Escolha a propriedade para gerenciar a governança.
                </p>
                <Select value={selectedPropertyId || ''} onValueChange={setSelectedPropertyId}>
                    <SelectTrigger className="w-full max-w-sm">
                        <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                        {properties.map((prop) => (
                            <SelectItem key={prop.id} value={prop.id}>
                                {prop.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-bold">Governança</h1>
                        {/* Property Selector */}
                        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {properties.map((prop) => (
                                    <SelectItem key={prop.id} value={prop.id}>
                                        {prop.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <FilterChip
                            label="Todos"
                            active={statusFilter === 'all'}
                            onClick={() => setStatusFilter('all')}
                            count={rooms.length}
                        />
                        <FilterChip
                            label="Sujo"
                            active={statusFilter === 'dirty'}
                            onClick={() => setStatusFilter('dirty')}
                            count={rooms.filter(r => r.status === 'dirty').length}
                        />
                        <FilterChip
                            label="Em limpeza"
                            active={statusFilter === 'cleaning'}
                            onClick={() => setStatusFilter('cleaning')}
                            count={rooms.filter(r => r.status === 'cleaning').length}
                        />
                        <FilterChip
                            label="Limpo"
                            active={statusFilter === 'clean'}
                            onClick={() => setStatusFilter('clean')}
                            count={rooms.filter(r => r.status === 'clean').length}
                        />
                        <FilterChip
                            label="Inspecionado"
                            active={statusFilter === 'inspected'}
                            onClick={() => setStatusFilter('inspected')}
                            count={rooms.filter(r => r.status === 'inspected').length}
                        />
                    </div>
                </div>
            </div>

            {/* Rooms List */}
            <div className="p-4 space-y-3">
                {roomsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-sm text-muted-foreground">Carregando quartos...</p>
                    </div>
                ) : rooms.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="pt-6">
                            <EmptyState
                                icon={Home}
                                title="Quartos ainda não cadastrados"
                                description="Crie seus quartos rapidamente usando modelos."
                                primaryAction={!isViewer ? {
                                    label: "Criar quartos rapidamente",
                                    onClick: () => navigate("/setup")
                                } : undefined}
                            />
                        </CardContent>
                    </Card>
                ) : filteredRooms.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="pt-6">
                            <EmptyState
                                icon={Search}
                                title="Nenhum resultado"
                                description="Tente mudar o filtro."
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredRooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                isViewer={isViewer}
                                updateStatus={updateRoomStatus}
                                propertyId={selectedPropertyId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Filter Chip Component
interface FilterChipProps {
    label: string;
    active: boolean;
    onClick: () => void;
    count: number;
}

const FilterChip = ({ label, active, onClick, count }: FilterChipProps) => {
    return (
        <button
            onClick={onClick}
            className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
        ${active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white text-gray-700 border border-gray-300'
                }
      `}
        >
            {label}
            <span className={`text-xs ${active ? 'opacity-90' : 'opacity-60'}`}>
                ({count})
            </span>
        </button>
    );
};

// Room Card Component
interface RoomCardProps {
    room: any;
    isViewer: boolean;
    updateStatus: any;
    propertyId: string;
}

const RoomCard = ({ room, isViewer, updateStatus, propertyId }: RoomCardProps) => {
    const currentStatus = room.status as RoomStatus;

    const handleStatusChange = (newStatus: RoomStatus) => {
        updateStatus.mutate({
            roomId: room.id,
            newStatus,
            propertyId,
        });
    };

    return (
        <Card className="border-2">
            <CardContent className="p-4 space-y-3">
                {/* Room Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-lg">{room.room_number}</h3>
                        {room.room_types?.name && (
                            <p className="text-sm text-muted-foreground">{room.room_types.name}</p>
                        )}
                    </div>
                    <Badge variant={getStatusVariant(currentStatus)}>
                        {getStatusLabel(currentStatus)}
                    </Badge>
                </div>

                {/* Last Updated */}
                {room.updated_at && (
                    <p className="text-xs text-muted-foreground">
                        Atualizado: {format(new Date(room.updated_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                )}

                {/* Status Action Buttons */}
                {!isViewer && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                variant={currentStatus === 'dirty' ? 'default' : 'outline'}
                                onClick={() => handleStatusChange('dirty')}
                                disabled={updateStatus.isPending || currentStatus === 'dirty'}
                                className="text-xs h-9"
                            >
                                Sujo
                            </Button>
                            <Button
                                size="sm"
                                variant={currentStatus === 'cleaning' ? 'default' : 'outline'}
                                onClick={() => handleStatusChange('cleaning')}
                                disabled={updateStatus.isPending || currentStatus === 'cleaning'}
                                className="text-xs h-9"
                            >
                                Em limpeza
                            </Button>
                            <Button
                                size="sm"
                                variant={currentStatus === 'clean' ? 'default' : 'outline'}
                                onClick={() => handleStatusChange('clean')}
                                disabled={updateStatus.isPending || currentStatus === 'clean'}
                                className="text-xs h-9"
                            >
                                Limpo
                            </Button>
                            <Button
                                size="sm"
                                variant={currentStatus === 'inspected' ? 'default' : 'outline'}
                                onClick={() => handleStatusChange('inspected')}
                                disabled={updateStatus.isPending || currentStatus === 'inspected'}
                                className="text-xs h-9"
                            >
                                Inspecionado
                            </Button>
                        </div>

                        {/* Out of Order (with confirmation) */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant={currentStatus === 'out_of_order' ? 'destructive' : 'outline'}
                                    disabled={updateStatus.isPending}
                                    className="text-xs h-9 w-full"
                                >
                                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                                    Fora de serviço
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Marcar como fora de serviço?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        O quarto {room.room_number} será marcado como indisponível para uso.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleStatusChange('out_of_order')}>
                                        Confirmar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}

                {/* Viewer Message */}
                {isViewer && (
                    <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground">
                            Visualização somente leitura
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MobileHousekeepingPage;
