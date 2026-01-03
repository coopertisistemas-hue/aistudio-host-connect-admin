import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useRoomCategories, RoomCategory } from "@/hooks/useRoomCategories";
import RoomCategoryDialog from "@/components/RoomCategoryDialog";
import DataTableSkeleton from "@/components/DataTableSkeleton";
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

const RoomCategoriesPage = () => {
    const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useRoomCategories();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const handleCreate = () => {
        setSelectedCategory(null);
        setDialogOpen(true);
    };

    const handleEdit = (category: RoomCategory) => {
        setSelectedCategory(category);
        setDialogOpen(true);
    };

    const handleSubmit = async (data: any) => {
        if (selectedCategory) {
            await updateCategory.mutateAsync({ id: selectedCategory.id, category: data });
        } else {
            await createCategory.mutateAsync(data);
        }
        setDialogOpen(false);
    };

    const handleDeleteClick = (id: string) => {
        setCategoryToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (categoryToDelete) {
            await deleteCategory.mutateAsync(categoryToDelete);
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Categorias de Acomodação</h1>
                        <p className="text-muted-foreground">
                            Gerencie as categorias de padrão das acomodações
                        </p>
                    </div>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Categoria
                    </Button>
                </div>

                {isLoading ? (
                    <DataTableSkeleton />
                ) : categories.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Nenhuma categoria cadastrada</h3>
                            <p className="text-muted-foreground text-center max-w-md mb-4">
                                Crie categorias para classificar seus tipos de acomodação.
                            </p>
                            <Button onClick={handleCreate}>
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
                                            <CardDescription className="text-xs">
                                                Slug: {category.slug} • Ordem: {category.display_order}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(category)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteClick(category.id)}
                                        >
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
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
};

export default RoomCategoriesPage;
