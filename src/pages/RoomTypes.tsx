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
import { Plus, Search, BedDouble, Home } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import RoomTypeDialog from "@/components/RoomTypeDialog";
import RoomTypeCard from "@/components/RoomTypeCard";
import { useRoomTypes, RoomType, RoomTypeInput } from "@/hooks/useRoomTypes";
import { useProperties } from "@/hooks/useProperties"; // To select which property's room types to display
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { useSelectedProperty } from "@/hooks/useSelectedProperty"; // NEW IMPORT

const RoomTypesPage = () => {
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  
  const { roomTypes, isLoading, createRoomType, updateRoomType, deleteRoomType } = useRoomTypes(selectedPropertyId);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomTypeToDelete, setRoomTypeToDelete] = useState<string | null>(null);

  const filteredRoomTypes = roomTypes.filter((roomType) =>
    roomType.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRoomType = () => {
    setSelectedRoomType(null);
    setDialogOpen(true);
  };

  const handleEditRoomType = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: RoomTypeInput) => {
    if (!selectedPropertyId) {
      // This should ideally not happen if the select is disabled or pre-selected
      console.error("No property selected for room type operation.");
      return;
    }

    if (selectedRoomType) {
      await updateRoomType.mutateAsync({ id: selectedRoomType.id, roomType: data });
    } else {
      await createRoomType.mutateAsync({ ...data, property_id: selectedPropertyId });
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setRoomTypeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (roomTypeToDelete) {
      await deleteRoomType.mutateAsync(roomTypeToDelete);
      setDeleteDialogOpen(false);
      setRoomTypeToDelete(null);
    }
  };

  const isDataLoading = isLoading || propertyStateLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tipos de Acomodação</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os tipos de quartos e acomodações das suas propriedades
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateRoomType} disabled={!selectedPropertyId}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Acomodação
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
              placeholder="Buscar tipo de acomodação..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedPropertyId}
            />
          </div>
        </div>

        {/* Room Types Grid */}
        {!selectedPropertyId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Selecione uma propriedade acima para gerenciar seus tipos de acomodação.
              </p>
            </CardContent>
          </Card>
        ) : isDataLoading ? (
          <DataTableSkeleton />
        ) : filteredRoomTypes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BedDouble className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhum tipo de acomodação encontrado" : "Nenhum tipo de acomodação cadastrado"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Comece cadastrando seu primeiro tipo de acomodação para esta propriedade."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateRoomType}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Acomodação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRoomTypes.map((roomType) => (
              <RoomTypeCard
                key={roomType.id}
                roomType={roomType}
                onEdit={handleEditRoomType}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Room Type Dialog */}
      <RoomTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        roomType={selectedRoomType}
        onSubmit={handleSubmit}
        isLoading={createRoomType.isPending || updateRoomType.isPending}
        initialPropertyId={selectedPropertyId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este tipo de acomodação? Esta ação não pode ser desfeita e
              todas as reservas associadas a este tipo de acomodação precisarão ser reavaliadas.
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

export default RoomTypesPage;