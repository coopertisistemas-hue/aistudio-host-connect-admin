import { useState, useMemo } from 'react';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useOrg } from '@/hooks/useOrg';
import { useAuth } from '@/hooks/useAuth';
import { useRooms } from '@/hooks/useRooms';
import { useUpdateRoomStatus, RoomStatus, getStatusLabel, getStatusVariant } from '@/hooks/useUpdateRoomStatus';
import { useProperties } from '@/hooks/useProperties';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnboardingBanner } from '@/components/onboarding/OnboardingBanner';
import { Sparkles, Loader2, AlertTriangle, Droplet, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmptyState } from '@/components/onboarding/EmptyState';
import { Building2, Home, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HousekeepingPage = () => {
    const { selectedPropertyId, setSelectedPropertyId } = useSelectedProperty();
    const { properties } = useProperties();
    const { currentOrgId } = useOrg();
    const { userRole } = useAuth();
    const isViewer = userRole === 'viewer';
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<RoomStatus | 'all'>('all');

    // Fetch rooms for selected property
    const { rooms, isLoading } = useRooms(selectedPropertyId);
    const updateRoomStatus = useUpdateRoomStatus();

    // Compute KPIs from rooms data (no extra queries)
    const kpis = useMemo(() => ({
        dirty: rooms.filter(r => r.status === 'dirty').length,
        cleaning: rooms.filter(r => r.status === 'cleaning').length,
        clean: rooms.filter(r => r.status === 'clean').length,
        inspected: rooms.filter(r => r.status === 'inspected').length,
        out_of_order: rooms.filter(r => r.status === 'out_of_order').length,
    }), [rooms]);

    // Filter rooms by active tab
    const filteredRooms = useMemo(() => {
        if (activeTab === 'all') return rooms;
        return rooms.filter(room => room.status === activeTab);
    }, [rooms, activeTab]);

    const handleStatusChange = (roomId: string, newStatus: RoomStatus) => {
        if (!selectedPropertyId) return;
        updateRoomStatus.mutate({
            roomId,
            newStatus,
            propertyId: selectedPropertyId,
        });
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6 p-6">
                {/* Sprint 6.0: Onboarding Banner */}
                <OnboardingBanner />

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border-2 border-amber-500/30">
                            <Sparkles className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Governança</h1>
                            <p className="text-sm text-muted-foreground">Painel Operacional • Status em tempo real</p>
                        </div>
                    </div>

                    {/* Property Selector */}
                    <Select value={selectedPropertyId || ''} onValueChange={setSelectedPropertyId}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Selecione a propriedade" />
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

                {/* Main Content / Empty States */}
                {properties.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent>
                            <EmptyState
                                icon={Building2}
                                title="Configuração inicial pendente"
                                description="Para começar, crie sua primeira propriedade e seus quartos."
                                primaryAction={!isViewer ? {
                                    label: "Ir para configuração inicial",
                                    onClick: () => navigate("/setup")
                                } : undefined}
                            />
                        </CardContent>
                    </Card>
                ) : !selectedPropertyId ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Building2 className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                            <h3 className="text-lg font-semibold mb-2">Selecione uma propriedade</h3>
                            <p className="text-muted-foreground text-center max-w-sm">
                                Escolha uma propriedade acima para visualizar o status da governança.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* KPI Indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <KPICard
                                label="Sujos"
                                count={kpis.dirty}
                                icon={<Droplet className="h-6 w-6" />}
                                colorClass="from-rose-500/20 to-rose-600/10 border-rose-500/30 text-rose-600"
                            />
                            <KPICard
                                label="Em limpeza"
                                count={kpis.cleaning}
                                icon={<Clock className="h-6 w-6" />}
                                colorClass="from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-600"
                            />
                            <KPICard
                                label="Prontos"
                                count={kpis.clean}
                                icon={<CheckCircle2 className="h-6 w-6" />}
                                colorClass="from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-600"
                            />
                            <KPICard
                                label="Inspecionados"
                                count={kpis.inspected}
                                icon={<Sparkles className="h-6 w-6" />}
                                colorClass="from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-600"
                            />
                            <KPICard
                                label="Fora de serviço"
                                count={kpis.out_of_order}
                                icon={<XCircle className="h-6 w-6" />}
                                colorClass="from-gray-500/20 to-gray-600/10 border-gray-500/30 text-gray-600"
                            />
                        </div>

                        {/* Status Tabs/Filters */}
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RoomStatus | 'all')}>
                            <TabsList className="w-full justify-start">
                                <TabsTrigger value="all">Todos ({rooms.length})</TabsTrigger>
                                <TabsTrigger value="dirty">Sujos ({kpis.dirty})</TabsTrigger>
                                <TabsTrigger value="cleaning">Em limpeza ({kpis.cleaning})</TabsTrigger>
                                <TabsTrigger value="clean">Prontos ({kpis.clean})</TabsTrigger>
                                <TabsTrigger value="inspected">Inspecionados ({kpis.inspected})</TabsTrigger>
                                <TabsTrigger value="out_of_order">Fora de serviço ({kpis.out_of_order})</TabsTrigger>
                            </TabsList>

                            <TabsContent value={activeTab} className="mt-6">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-24">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                        <p className="mt-4 text-sm text-muted-foreground">Carregando quartos...</p>
                                    </div>
                                ) : rooms.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent>
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
                                        <CardContent>
                                            <EmptyState
                                                icon={Search}
                                                title="Nenhum resultado"
                                                description="Tente mudar o filtro."
                                            />
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredRooms.map((room) => (
                                            <RoomCard
                                                key={room.id}
                                                room={room}
                                                isViewer={isViewer}
                                                onStatusChange={handleStatusChange}
                                                isPending={updateRoomStatus.isPending}
                                            />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

// KPI Card Component
interface KPICardProps {
    label: string;
    count: number;
    icon: React.ReactNode;
    colorClass: string;
}

const KPICard = ({ label, count, icon, colorClass }: KPICardProps) => (
    <Card className={`border-2 bg-gradient-to-br ${colorClass}`}>
        <CardContent className="p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium opacity-80 uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-bold mt-1">{count}</p>
                </div>
                <div className="opacity-60">{icon}</div>
            </div>
        </CardContent>
    </Card>
);

// Room Card Component
interface RoomCardProps {
    room: any;
    isViewer: boolean;
    onStatusChange: (roomId: string, newStatus: RoomStatus) => void;
    isPending: boolean;
}

const RoomCard = ({ room, isViewer, onStatusChange, isPending }: RoomCardProps) => {
    const currentStatus = room.status as RoomStatus;

    return (
        <Card className="border-2 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{room.room_number}</CardTitle>
                        {room.room_types?.name && (
                            <p className="text-xs text-muted-foreground mt-1">{room.room_types.name}</p>
                        )}
                    </div>
                    <Badge variant={getStatusVariant(currentStatus)}>
                        {getStatusLabel(currentStatus)}
                    </Badge>
                </div>
                {room.updated_at && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                        Atualizado: {format(new Date(room.updated_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                )}
            </CardHeader>

            <CardContent className="space-y-2">
                {!isViewer && (
                    <>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                size="sm"
                                variant={currentStatus === 'dirty' ? 'default' : 'outline'}
                                onClick={() => onStatusChange(room.id, 'dirty')}
                                disabled={isPending || currentStatus === 'dirty'}
                                className="text-xs"
                            >
                                Sujo
                            </Button>
                            <Button
                                size="sm"
                                variant={currentStatus === 'cleaning' ? 'default' : 'outline'}
                                onClick={() => onStatusChange(room.id, 'cleaning')}
                                disabled={isPending || currentStatus === 'cleaning'}
                                className="text-xs"
                            >
                                Em limpeza
                            </Button>
                            <Button
                                size="sm"
                                variant={currentStatus === 'clean' ? 'default' : 'outline'}
                                onClick={() => onStatusChange(room.id, 'clean')}
                                disabled={isPending || currentStatus === 'clean'}
                                className="text-xs"
                            >
                                Limpo
                            </Button>
                            <Button
                                size="sm"
                                variant={currentStatus === 'inspected' ? 'default' : 'outline'}
                                onClick={() => onStatusChange(room.id, 'inspected')}
                                disabled={isPending || currentStatus === 'inspected'}
                                className="text-xs"
                            >
                                Inspecionado
                            </Button>
                        </div>

                        {/* Out of Order with confirmation */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    size="sm"
                                    variant={currentStatus === 'out_of_order' ? 'destructive' : 'outline'}
                                    disabled={isPending}
                                    className="text-xs w-full"
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
                                    <AlertDialogAction onClick={() => onStatusChange(room.id, 'out_of_order')}>
                                        Confirmar
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                )}

                {isViewer && (
                    <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground">Visualização somente leitura</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default HousekeepingPage;
