import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Wifi, Home } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AmenityDialog from '@/components/AmenityDialog';
import AmenityCard from '@/components/AmenityCard';
import { useAmenities, Amenity, AmenityInput } from '@/hooks/useAmenities';
import { useAuth } from '@/hooks/useAuth';
import { useProperties } from '@/hooks/useProperties';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import DataTableSkeleton from '@/components/DataTableSkeleton';

const AmenitiesPage = () => {
  const { userRole } = useAuth();
  const isViewer = userRole === 'viewer';

  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  const { amenities, isLoading, createAmenity, updateAmenity, deleteAmenity } = useAmenities(selectedPropertyId);

  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [amenityToDelete, setAmenityToDelete] = useState<string | null>(null);

  const filteredAmenities = amenities.filter((amenity) =>
    amenity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    amenity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    amenity.icon?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAmenity = () => {
    if (isViewer || !selectedPropertyId) return;
    setSelectedAmenity(null);
    setDialogOpen(true);
  };

  const handleEditAmenity = (amenity: Amenity) => {
    if (isViewer) return;
    setSelectedAmenity(amenity);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: AmenityInput) => {
    if (isViewer || !selectedPropertyId) return;

    if (selectedAmenity) {
      await updateAmenity.mutateAsync({ id: selectedAmenity.id, amenity: data });
    } else {
      await createAmenity.mutateAsync({ ...data, property_id: selectedPropertyId });
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    if (isViewer) return;
    setAmenityToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isViewer || !amenityToDelete) return;
    await deleteAmenity.mutateAsync(amenityToDelete);
    setDeleteDialogOpen(false);
    setAmenityToDelete(null);
  };

  const isDataLoading = isLoading || propertyStateLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Comodidades</h1>
            <p className="text-muted-foreground mt-1">Gerencie comodidades por propriedade.</p>
          </div>
          <Button variant="hero" onClick={handleCreateAmenity} disabled={isViewer || !selectedPropertyId}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Comodidade
          </Button>
        </div>

        <div className="flex gap-4 flex-col sm:flex-row">
          <Select
            value={selectedPropertyId || undefined}
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
              placeholder="Buscar comodidade por nome ou descricao..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedPropertyId}
            />
          </div>
        </div>

        {!selectedPropertyId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md">Selecione uma propriedade para gerenciar comodidades.</p>
            </CardContent>
          </Card>
        ) : isDataLoading ? (
          <DataTableSkeleton />
        ) : filteredAmenities.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{searchQuery ? 'Nenhuma comodidade encontrada' : 'Nenhuma comodidade cadastrada'}</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">{searchQuery ? 'Tente ajustar sua busca' : 'Cadastre comodidades para esta propriedade.'}</p>
              {!searchQuery && (
                <Button onClick={handleCreateAmenity} disabled={isViewer}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Comodidade
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAmenities.map((amenity) => (
              <AmenityCard
                key={amenity.id}
                amenity={amenity}
                onEdit={handleEditAmenity}
                onDelete={handleDeleteClick}
                isViewer={isViewer}
              />
            ))}
          </div>
        )}
      </div>

      <AmenityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        amenity={selectedAmenity}
        onSubmit={handleSubmit}
        isLoading={createAmenity.isPending || updateAmenity.isPending}
        initialPropertyId={selectedPropertyId || undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusao</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta comodidade?</AlertDialogDescription>
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

export default AmenitiesPage;

