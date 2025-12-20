import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Bed, Home } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import RoomDialog from "@/components/RoomDialog";
import RoomCard from "@/components/RoomCard";
import { useRooms, Room, RoomInput } from "@/hooks/useRooms";
import { useProperties } from "@/hooks/useProperties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { useSelectedProperty } from "@/hooks/useSelectedProperty"; // NEW IMPORT

const RoomsPage = () => {
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  
  const { rooms, isLoading, createRoom, updateRoom, deleteRoom } = useRooms(selectedPropertyId);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  const filteredRooms = rooms.filter((room) =>
    room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.room_types?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRoom = () => {
    setSelectedRoom(null);
    setDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: RoomInput) => {
    if (!selectedPropertyId) {
      console.error("No property selected for room operation.");
      return;
    }

    if (selectedRoom) {
      await updateRoom.mutateAsync({ id: selectedRoom.id, room: data });
    } else {
      await createRoom.mutateAsync({ ...data, property_id: selectedPropertyId });
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setRoomToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (roomToDelete) {
      await deleteRoom.mutateAsync(roomToDelete);
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    }
  };

  const isDataLoading = isLoading || propertyStateLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Quartos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os quartos individuais das suas propriedades
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateRoom} disabled={!selectedPropertyId}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Quarto
          </Button>
        </div>

        {/* Property Selector and Search */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <Select
            value={selectedPropertyId}
            onValueChange={setSelectedPropertyId}
            disabled={properties.length === 0 || propertyStateLoading}
          >
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Selecione uma propriedade" />
            </SelectTrigger>
            <SelectContent>
              {properties.map((prop) => (
                <SelectItem key={prop.id} value={prop.id}>
                  {prop.name} ({prop.city})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar quarto por número ou tipo..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedPropertyId}
            />
          </div>
        </div>

        {/* Rooms Grid */}
        {!selectedPropertyId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Selecione uma propriedade acima para gerenciar seus quartos.
              </p>
            </CardContent>
          </Card>
        ) : isDataLoading ? (
          <DataTableSkeleton />
        ) : filteredRooms.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhum quarto encontrado" : "Nenhum quarto cadastrado"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Comece cadastrando seu primeiro quarto para esta propriedade."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateRoom}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Quarto
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onEdit={handleEditRoom}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Room Dialog */}
      <RoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        room={selectedRoom}
        onSubmit={handleSubmit}
        isLoading={createRoom.isPending || updateRoom.isPending}
        initialPropertyId={selectedPropertyId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este quarto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default RoomsPage;