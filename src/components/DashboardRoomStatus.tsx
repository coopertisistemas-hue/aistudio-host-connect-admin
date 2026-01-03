import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRooms, Room } from '@/hooks/useRooms';
import { useProperties } from '@/hooks/useProperties';
import { useState, useEffect } from 'react';
import { Bed, CheckCircle2, XCircle, Wrench, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { Button } from '@/components/ui/button';

const getStatusClasses = (status: Room['status']) => {
  switch (status) {
    case 'available':
      return 'bg-success/10 border-success text-success';
    case 'occupied':
      return 'bg-destructive/10 border-destructive text-destructive';
    case 'maintenance':
      return 'bg-primary/10 border-primary text-primary';
    default:
      return 'bg-muted border-border text-muted-foreground';
  }
};

const getStatusIcon = (status: Room['status']) => {
  switch (status) {
    case 'available':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'occupied':
      return <XCircle className="h-4 w-4" />;
    case 'maintenance':
      return <Wrench className="h-4 w-4" />;
    default:
      return <Bed className="h-4 w-4" />;
  }
};

const DashboardRoomStatus = () => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();

  const { rooms, isLoading: roomsLoading, error: roomsError } = useRooms(selectedPropertyId);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let timer: number;
    if (roomsLoading) {
      timer = window.setTimeout(() => {
        setHasTimedOut(true);
      }, 10000); // 10s timeout
    } else {
      setHasTimedOut(false);
    }
    return () => clearTimeout(timer);
  }, [roomsLoading]);

  const roomCounts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {} as Record<Room['status'], number>);

  const totalRooms = rooms.length;
  const isLoading = (propertiesLoading || roomsLoading || propertyStateLoading) && !hasTimedOut;

  if (roomsError || hasTimedOut) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status dos Quartos</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <p className="text-destructive mb-4 font-medium">
            {hasTimedOut
              ? "Tempo limite excedido ao carregar quartos"
              : "Erro ao carregar status dos quartos"}
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <Loader2 className="mr-2 h-4 w-4" />
            Recarregar Página
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Status dos Quartos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground animate-pulse">Carregando status dos quartos...</span>
          </div>
        ) : !selectedPropertyId ? (
          <div className="py-8 text-center border-2 border-dashed rounded-xl">
            <Bed className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground font-medium">Selecione uma propriedade para visualizar o mapa de quartos.</p>
          </div>
        ) : totalRooms === 0 ? (
          <div className="py-8 text-center border-2 border-dashed rounded-xl">
            <Bed className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground font-medium">Nenhum quarto cadastrado para esta propriedade.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className={cn("p-3 text-center border-2", getStatusClasses('available'))}>
                <p className="text-3xl font-bold">{roomCounts.available || 0}</p>
                <p className="text-sm font-medium">Disponível</p>
              </Card>
              <Card className={cn("p-3 text-center border-2", getStatusClasses('occupied'))}>
                <p className="text-3xl font-bold">{roomCounts.occupied || 0}</p>
                <p className="text-sm font-medium">Ocupado</p>
              </Card>
              <Card className={cn("p-3 text-center border-2", getStatusClasses('maintenance'))}>
                <p className="text-3xl font-bold">{roomCounts.maintenance || 0}</p>
                <p className="text-sm font-medium">Manutenção</p>
              </Card>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 max-h-64 overflow-y-auto p-2 border rounded-md">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={cn(
                    "p-2 rounded-md text-center text-xs font-medium cursor-pointer transition-all hover:scale-105",
                    getStatusClasses(room.status)
                  )}
                  title={`Quarto ${room.room_number} - ${room.room_types?.name || 'N/A'}`}
                >
                  {getStatusIcon(room.status)}
                  <span className="block mt-1 truncate">{room.room_number}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardRoomStatus;