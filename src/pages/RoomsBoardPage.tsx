import { useMemo, useState } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useBulkRoomStatusUpdate, BulkRoomStatus } from '@/hooks/useBulkRoomStatusUpdate';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { RoomOperationCard } from '@/components/RoomOperationCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, LayoutGrid, SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DataTableSkeleton from '@/components/DataTableSkeleton';
import { RoomStatus, getRoomStatusLabel } from '@/lib/constants/statuses';

const BULK_STATUS_OPTIONS: BulkRoomStatus[] = ['dirty', 'cleaning', 'clean', 'inspected', 'out_of_order', 'available', 'occupied', 'maintenance'];

const RoomsBoardPage = () => {
  const { selectedPropertyId } = useSelectedProperty();
  const { userRole } = useAuth();
  const isViewer = userRole === 'viewer';
  const { rooms, isLoading } = useRooms(selectedPropertyId);
  const bulkUpdate = useBulkRoomStatusUpdate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [batchStatus, setBatchStatus] = useState<BulkRoomStatus | ''>('');

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const matchesSearch =
          room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.room_types?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [rooms, searchQuery, statusFilter]
  );

  const statuses: { label: string; value: string; count: number }[] = [
    { label: 'Todos', value: 'all', count: rooms.length },
    { label: getRoomStatusLabel(RoomStatus.DIRTY), value: RoomStatus.DIRTY, count: rooms.filter((r) => r.status === RoomStatus.DIRTY).length },
    { label: getRoomStatusLabel(RoomStatus.CLEAN), value: RoomStatus.CLEAN, count: rooms.filter((r) => r.status === RoomStatus.CLEAN).length },
    { label: getRoomStatusLabel(RoomStatus.INSPECTED), value: RoomStatus.INSPECTED, count: rooms.filter((r) => r.status === RoomStatus.INSPECTED).length },
    { label: 'Ocupado', value: 'occupied', count: rooms.filter((r) => r.status === 'occupied').length },
    { label: 'OOO', value: 'out_of_order', count: rooms.filter((r) => r.status === 'out_of_order' || r.status === 'ooo').length },
  ];

  const toggleRoomSelection = (roomId: string, checked: boolean) => {
    setSelectedRoomIds((prev) => {
      if (checked) return [...new Set([...prev, roomId])];
      return prev.filter((id) => id !== roomId);
    });
  };

  const selectAllFiltered = () => {
    setSelectedRoomIds(filteredRooms.map((room) => room.id));
  };

  const clearSelection = () => {
    setSelectedRoomIds([]);
  };

  const applyBulkStatus = async () => {
    if (!selectedPropertyId || !batchStatus || selectedRoomIds.length === 0) return;
    await bulkUpdate.mutateAsync({
      propertyId: selectedPropertyId,
      roomIds: selectedRoomIds,
      newStatus: batchStatus,
    });
    clearSelection();
    setBatchStatus('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center backdrop-blur-sm">
                <LayoutGrid className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Quadro de Quartos</h1>
                <p className="text-sm text-muted-foreground font-medium">Operacao ao vivo · Governanca</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1.5 font-semibold">{rooms.length} {rooms.length === 1 ? 'Quarto' : 'Quartos'}</Badge>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por numero ou tipo de quarto..."
              className="pl-11 pr-10 h-12 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg hover:bg-muted/80 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 overflow-x-auto pb-2">
            {statuses.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all border-2 ${statusFilter === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                <span>{s.label}</span>
                <span>·</span>
                <span className="font-black">{s.count}</span>
              </button>
            ))}
          </div>
        </div>

        {!isViewer && (
          <div className="rounded-xl border bg-card p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={selectAllFiltered} disabled={!filteredRooms.length}>Selecionar filtrados</Button>
              <Button type="button" variant="outline" onClick={clearSelection} disabled={!selectedRoomIds.length}>Limpar</Button>
              <Badge variant="secondary">{selectedRoomIds.length} selecionado(s)</Badge>
            </div>

            <div className="flex gap-2 items-center">
              <Select value={batchStatus || undefined} onValueChange={(value) => setBatchStatus(value as BulkRoomStatus)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Novo status" />
                </SelectTrigger>
                <SelectContent>
                  {BULK_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={applyBulkStatus} disabled={!selectedRoomIds.length || !batchStatus || !selectedPropertyId || bulkUpdate.isPending}>
                Aplicar em lote
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <DataTableSkeleton rows={6} variant="room-grid" />
        ) : filteredRooms.length === 0 ? (
          <div className="relative py-24 text-center rounded-3xl bg-gradient-to-br from-muted/30 via-muted/10 to-background border-2 border-dashed overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="mx-auto h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                <Filter className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2 max-w-md mx-auto px-4">
                <h3 className="text-xl font-bold">Nenhum quarto encontrado</h3>
                <p className="text-muted-foreground">Ajuste filtros ou busca.</p>
              </div>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                Limpar Filtros
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <RoomOperationCard
                key={room.id}
                room={room}
                selectable={!isViewer}
                selected={selectedRoomIds.includes(room.id)}
                onToggleSelect={toggleRoomSelection}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RoomsBoardPage;

