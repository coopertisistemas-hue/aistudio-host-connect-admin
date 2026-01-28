import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { useDemands } from '@/hooks/useDemands';
import { RoomStatus, useUpdateRoomStatus } from '@/hooks/useUpdateRoomStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProperties } from '@/hooks/useProperties';
import { Home, Search, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/onboarding/EmptyState';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import FullPageLoading from '@/components/FullPageLoading';
import { Skeleton } from '@/components/ui/skeleton';
import MobileRoomCard from '@/components/housekeeping/MobileRoomCard';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { BulkAction, getBulkActionState } from '@/lib/housekeeping/bulkRules';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { useQueryClient } from '@tanstack/react-query';

const MobileHousekeepingPage = () => {
    const { selectedPropertyId, setSelectedPropertyId } = useSelectedProperty();
    const { properties, isLoading: propertiesLoading } = useProperties();
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
    const [bulkAction, setBulkAction] = useState<BulkAction | ''>('');
    const [bulkProgress, setBulkProgress] = useState({
        isRunning: false,
        current: 0,
        total: 0,
        success: 0,
        failure: 0,
        cancelled: false,
        showSummary: false,
    });
    const cancelRef = useRef(false);
    const bulkActionsEnabled = isFeatureEnabled('HK_BULK_ACTIONS');

    // Fetch rooms for selected property
    const { rooms, isLoading: roomsLoading, error: roomsError } = useRooms(selectedPropertyId);
    const { createDemand } = useDemands(selectedPropertyId);
    const bulkUpdateStatus = useUpdateRoomStatus({ suppressToast: true });

    const statusCounts = useMemo(() => {
        const counts = {
            dirty: 0,
            cleaning: 0,
            clean: 0,
            inspected: 0,
            out_of_order: 0,
            all: rooms.length,
        };

        rooms.forEach((room) => {
            switch (room.status) {
                case 'dirty':
                    counts.dirty += 1;
                    break;
                case 'cleaning':
                    counts.cleaning += 1;
                    break;
                case 'clean':
                    counts.clean += 1;
                    break;
                case 'inspected':
                    counts.inspected += 1;
                    break;
                case 'out_of_order':
                    counts.out_of_order += 1;
                    break;
                default:
                    break;
            }
        });

        return counts;
    }, [rooms]);

    const selectedRooms = useMemo(
        () => rooms.filter((room) => selectedRoomIds.includes(room.id)),
        [rooms, selectedRoomIds],
    );

    const bulkActionState = useMemo(
        () => getBulkActionState(selectedRooms, bulkAction),
        [selectedRooms, bulkAction],
    );

    useEffect(() => {
        if (!bulkActionsEnabled) {
            setSelectionMode(false);
        }
    }, [bulkActionsEnabled]);

    useEffect(() => {
        if (!selectionMode) {
            setSelectedRoomIds([]);
            setBulkAction('');
            setBulkProgress({
                isRunning: false,
                current: 0,
                total: 0,
                success: 0,
                failure: 0,
                cancelled: false,
                showSummary: false,
            });
            cancelRef.current = false;
        }
    }, [selectionMode]);

    useEffect(() => {
        if (selectedRoomIds.length === 0) return;
        setSelectedRoomIds((prev) => prev.filter((id) => rooms.some((room) => room.id === id)));
    }, [rooms, selectedRoomIds.length]);

    const handleToggleSelection = (roomId: string) => {
        setSelectedRoomIds((prev) =>
            prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
        );
    };

    const handleClearSelection = () => {
        setSelectedRoomIds([]);
        setBulkAction('');
        setBulkProgress({
            isRunning: false,
            current: 0,
            total: 0,
            success: 0,
            failure: 0,
            cancelled: false,
            showSummary: false,
        });
        cancelRef.current = false;
    };

    const handleCancelBulk = () => {
        cancelRef.current = true;
        setBulkProgress((prev) => ({
            ...prev,
            cancelled: true,
        }));
    };

    const handleBulkApply = async () => {
        if (!selectedRooms.length || bulkProgress.isRunning) return;
        if (isViewer) return;
        if (!bulkActionState.canApply) return;
        if (!selectedPropertyId) return;
        if (!bulkAction) return;

        const targetStatus = bulkAction as RoomStatus;

        cancelRef.current = false;
        setBulkProgress({
            isRunning: true,
            current: 0,
            total: selectedRooms.length,
            success: 0,
            failure: 0,
            cancelled: false,
            showSummary: false,
        });

        let successCount = 0;
        let failureCount = 0;

        for (let index = 0; index < selectedRooms.length; index += 1) {
            if (cancelRef.current) {
                break;
            }
            const room = selectedRooms[index];
            setBulkProgress((prev) => ({
                ...prev,
                current: index + 1,
                success: successCount,
                failure: failureCount,
            }));

            try {
                await bulkUpdateStatus.mutateAsync({
                    roomId: room.id,
                    newStatus: targetStatus,
                    propertyId: selectedPropertyId,
                });
                successCount += 1;
            } catch {
                failureCount += 1;
            }
        }

        if (cancelRef.current) {
            failureCount += Math.max(0, selectedRooms.length - successCount - failureCount);
        }

        setBulkProgress({
            isRunning: false,
            current: selectedRooms.length,
            total: selectedRooms.length,
            success: successCount,
            failure: failureCount,
            cancelled: cancelRef.current,
            showSummary: true,
        });

        if (failureCount > 0) {
            toast({
                title: 'Alguns quartos não puderam ser atualizados.',
                variant: 'destructive',
            });
            return;
        }

        toast({
            title: 'Atualização concluída.',
        });
    };

    // Filter rooms by status
    const filteredRooms = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return rooms.filter((room) => {
            if (statusFilter !== 'all' && room.status !== statusFilter) {
                return false;
            }

            if (!normalizedQuery) return true;

            const searchText = [
                room.room_number,
                room.room_types?.name,
                (room as { name?: string | null }).name,
                (room as { notes?: string | null }).notes,
                (room as { observation?: string | null }).observation,
                (room as { observacao?: string | null }).observacao,
            ]
                .filter((value) => typeof value === 'string')
                .join(' ')
                .toLowerCase();

            return searchText.includes(normalizedQuery);
        });
    }, [rooms, searchQuery, statusFilter]);

    // Loading state
    if (propertiesLoading) {
        return <FullPageLoading message="Carregando propriedades..." />;
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

    const bulkBarVisible =
        bulkActionsEnabled &&
        selectionMode &&
        (selectedRoomIds.length > 0 || bulkProgress.showSummary || bulkProgress.isRunning);
    const bulkHelper = isViewer
        ? 'Usuários somente leitura não podem aplicar ações.'
        : bulkActionState.helper;
    const bulkApplyDisabled =
        !bulkActionState.canApply || isViewer || bulkProgress.isRunning || selectedRooms.length === 0;

    return (
        <div className={`min-h-screen bg-gray-50 ${bulkBarVisible ? 'pb-36' : 'pb-20'}`}>
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

                    {bulkActionsEnabled && (
                        <Button
                            variant={selectionMode ? 'default' : 'outline'}
                            size="sm"
                            className="h-9"
                            onClick={() => setSelectionMode((prev) => !prev)}
                        >
                            {selectionMode ? 'Modo seleção ativo' : 'Modo seleção'}
                        </Button>
                    )}

                    <div className="relative">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Buscar quarto, hóspede ou observação"
                            className="pl-9 h-10"
                        />
                    </div>

                    {/* Status Filter Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <FilterChip
                            label="Pendentes"
                            active={statusFilter === 'dirty'}
                            onClick={() => setStatusFilter('dirty')}
                            count={statusCounts.dirty}
                        />
                        <FilterChip
                            label="Em limpeza"
                            active={statusFilter === 'cleaning'}
                            onClick={() => setStatusFilter('cleaning')}
                            count={statusCounts.cleaning}
                        />
                        <FilterChip
                            label="Limpos"
                            active={statusFilter === 'clean'}
                            onClick={() => setStatusFilter('clean')}
                            count={statusCounts.clean}
                        />
                        <FilterChip
                            label="Revisão"
                            active={statusFilter === 'inspected'}
                            onClick={() => setStatusFilter('inspected')}
                            count={statusCounts.inspected}
                        />
                        <FilterChip
                            label="Fora de serviço"
                            active={statusFilter === 'out_of_order'}
                            onClick={() => setStatusFilter('out_of_order')}
                            count={statusCounts.out_of_order}
                        />
                        <FilterChip
                            label="Todos"
                            active={statusFilter === 'all'}
                            onClick={() => setStatusFilter('all')}
                            count={statusCounts.all}
                        />
                    </div>
                </div>
            </div>

            {/* Rooms List */}
            <div className="p-4 space-y-3">
                {!roomsLoading && !roomsError && rooms.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                        Exibindo: {filteredRooms.length} quartos
                    </p>
                )}
                {roomsLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-40 w-full" />
                        ))}
                    </div>
                ) : roomsError ? (
                    <Card className="border-dashed">
                        <CardContent className="pt-6 space-y-4">
                            <EmptyState
                                icon={Home}
                                title="Não foi possível carregar os dados. Tente novamente."
                                description=""
                            />
                            <Button
                                variant="outline"
                                className="w-full h-11"
                                onClick={() => queryClient.invalidateQueries({ queryKey: ['rooms'] })}
                            >
                                Tentar novamente
                            </Button>
                        </CardContent>
                    </Card>
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
                                title="Nenhum quarto encontrado para os filtros selecionados."
                                description=""
                            />
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredRooms.map((room) => (
                            <MobileRoomCard
                                key={room.id}
                                room={room}
                                isViewer={isViewer}
                                propertyId={selectedPropertyId}
                                createDemand={createDemand}
                                selectionMode={bulkActionsEnabled ? selectionMode : false}
                                isSelected={bulkActionsEnabled ? selectedRoomIds.includes(room.id) : false}
                                onToggleSelect={bulkActionsEnabled ? handleToggleSelection : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>

            {bulkBarVisible && (
                <div className="fixed bottom-0 inset-x-0 border-t bg-white/95 backdrop-blur p-3">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">
                                Selecionados: {selectedRoomIds.length}
                            </p>
                            {bulkProgress.isRunning && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Atualizando {bulkProgress.current} de {bulkProgress.total}...
                                </div>
                            )}
                        </div>

                        {bulkProgress.showSummary && (
                            <p className="text-xs text-muted-foreground">
                                Sucesso: {bulkProgress.success} • Falhas: {bulkProgress.failure}
                            </p>
                        )}

                        {!bulkProgress.isRunning && !bulkProgress.showSummary && (
                            <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as BulkAction)}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Selecione uma ação" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cleaning">Marcar como em limpeza</SelectItem>
                                    <SelectItem value="clean">Marcar como limpo</SelectItem>
                                    <SelectItem value="inspected">Marcar como em revisão</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {bulkHelper && (
                            <p className="text-xs text-muted-foreground">{bulkHelper}</p>
                        )}

                        <div className="flex items-center gap-2">
                            {bulkProgress.isRunning ? (
                                <Button variant="outline" className="flex-1 h-10" onClick={handleCancelBulk}>
                                    Cancelar
                                </Button>
                            ) : bulkProgress.showSummary ? (
                                <Button variant="outline" className="flex-1 h-10" onClick={handleClearSelection}>
                                    Fechar
                                </Button>
                            ) : (
                                <Button variant="outline" className="flex-1 h-10" onClick={handleClearSelection}>
                                    Limpar seleção
                                </Button>
                            )}
                            {!bulkProgress.isRunning && !bulkProgress.showSummary && (
                                <Button
                                    className="flex-1 h-10"
                                    onClick={handleBulkApply}
                                    disabled={bulkApplyDisabled}
                                >
                                    Aplicar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
            {label} ({count})
        </button>
    );
};

export default MobileHousekeepingPage;
