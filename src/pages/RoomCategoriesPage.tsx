import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Tag, Home } from 'lucide-react';
import { useRoomCategories, RoomCategory, RoomCategoryInput } from '@/hooks/useRoomCategories';
import RoomCategoryDialog from '@/components/RoomCategoryDialog';
import DataTableSkeleton from '@/components/DataTableSkeleton';
import { useProperties } from '@/hooks/useProperties';
import { useSelectedProperty } from '@/hooks/useSelectedProperty';
import { useAuth } from '@/hooks/useAuth';
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

const RoomCategoriesPage = () => {
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  const { userRole } = useAuth();
  const isViewer = userRole === 'viewer';

  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useRoomCategories(selectedPropertyId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    if (isViewer || !selectedPropertyId) return;
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleEdit = (category: RoomCategory) => {
    if (isViewer) return;
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: RoomCategoryInput) => {
    if (isViewer || !selectedPropertyId) return;

    if (selectedCategory) {
      await updateCategory.mutateAsync({ id: selectedCategory.id, category: data });
    } else {
      await createCategory.mutateAsync({ ...data, property_id: selectedPropertyId });
    }

    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    if (isViewer) return;
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (isViewer || !categoryToDelete) return;
    await deleteCategory.mutateAsync(categoryToDelete);
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const isDataLoading = isLoading || propertyStateLoading;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias de Acomodacao</h1>
            <p className="text-muted-foreground">Gerencie categorias por propriedade.</p>
          </div>
          <Button onClick={handleCreate} disabled={!selectedPropertyId || isViewer}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        <Select
          value={selectedPropertyId || undefined}
          onValueChange={setSelectedPropertyId}
          disabled={properties.length === 0 || propertyStateLoading}
        >
          <SelectTrigger className="w-full sm:w-[320px]">
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

        {!selectedPropertyId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md">Selecione uma propriedade para visualizar categorias.</p>
            </CardContent>
          </Card>
        ) : isDataLoading ? (
          <DataTableSkeleton />
        ) : categories.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma categoria cadastrada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">Crie categorias para esta propriedade.</p>
              <Button onClick={handleCreate} disabled={isViewer}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Categoria
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription className="text-xs">Slug: {category.slug} · Ordem: {category.display_order}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(category)} disabled={isViewer}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteClick(category.id)} disabled={isViewer}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {category.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <RoomCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        onSubmit={handleSubmit}
        initialPropertyId={selectedPropertyId || undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta categoria?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default RoomCategoriesPage;

