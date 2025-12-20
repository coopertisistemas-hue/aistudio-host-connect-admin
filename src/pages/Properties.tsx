import { useState } from "react";
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
import { Plus, Search, Home } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PropertyDialog from "@/components/PropertyDialog";
import PropertyCard from "@/components/PropertyCard";
import { useProperties, Property, PropertyInput } from "@/hooks/useProperties";
import DataTableSkeleton from "@/components/DataTableSkeleton";

const Properties = () => {
  const { properties, isLoading, createProperty, updateProperty, deleteProperty } = useProperties();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<string | null>(null);

  const filteredProperties = properties.filter((property) =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProperty = () => {
    setSelectedProperty(null);
    setDialogOpen(true);
  };

  const handleEditProperty = (property: Property) => {
    setSelectedProperty(property);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: PropertyInput) => {
    if (selectedProperty) {
      await updateProperty.mutateAsync({ id: selectedProperty.id, property: data });
    } else {
      await createProperty.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setPropertyToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (propertyToDelete) {
      await deleteProperty.mutateAsync(propertyToDelete);
      setDeleteDialogOpen(false);
      setPropertyToDelete(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Propriedades</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas propriedades hoteleiras
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateProperty}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Propriedade
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar propriedades..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <DataTableSkeleton />
        ) : filteredProperties.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhuma propriedade encontrada" : "Nenhuma propriedade cadastrada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Comece cadastrando sua primeira propriedade para gerenciar suas reservas"}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateProperty}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Propriedade
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={handleEditProperty}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Property Dialog */}
      <PropertyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        property={selectedProperty}
        onSubmit={handleSubmit}
        isLoading={createProperty.isPending || updateProperty.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta propriedade? Esta ação não pode ser desfeita e
              todas as reservas associadas também serão removidas.
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

export default Properties;