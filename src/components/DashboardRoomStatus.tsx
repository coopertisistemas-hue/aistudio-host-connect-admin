import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRooms, Room } from '@/hooks/useRooms';
import { useProperties } from '@/hooks/useProperties';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { Bed, CheckCircle2, XCircle, Wrench, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSelectedProperty } from '@/hooks/useSelectedProperty'; // NEW IMPORT

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

  const { rooms, isLoading: roomsLoading } = useRooms(selectedPropertyId);

  const roomCounts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {} as Record<Room['status'], number>);

  const totalRooms = rooms.length;
  const isLoading = propertiesLoading || roomsLoading || propertyStateLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Status dos Quartos</CardTitle>
        <Select
          value={selectedPropertyId || ''}
          onValueChange={setSelectedPropertyId}
          disabled={isLoading || properties.length === 0}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione a Propriedade" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((prop) => (
              <SelectItem key={prop.id} value={prop.id}>
                {prop.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </div>
        ) : !selectedPropertyId ? (
          <p className="text-muted-foreground text-center py-8">Selecione uma propriedade para ver o status.</p>
        ) : totalRooms === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhum quarto cadastrado para esta propriedade.</p>
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