import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
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
import { Plus, Search, Zap, Edit, Trash2, HelpCircle } from "lucide-react";
import { useFeatures, Feature, FeatureInput } from "@/hooks/useFeatures";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import FeatureDialog from "@/components/admin/FeatureDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import * as LucideIcons from "lucide-react";

const AdminFeaturesPage = () => {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const navigate = useNavigate();
  
  const { features, isLoading, createFeature, updateFeature, deleteFeature } = useFeatures();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, authLoading, navigate]);

  const filteredFeatures = features.filter((feature) =>
    feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feature.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateFeature = () => {
    setSelectedFeature(null);
    setDialogOpen(true);
  };

  const handleEditFeature = (feature: Feature) => {
    setSelectedFeature(feature);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: FeatureInput) => {
    if (selectedFeature) {
      await updateFeature.mutateAsync({ id: selectedFeature.id, feature: data });
    } else {
      await createFeature.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setFeatureToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (featureToDelete) {
      await deleteFeature.mutateAsync(featureToDelete);
      setDeleteDialogOpen(false);
      setFeatureToDelete(null);
    }
  };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return HelpCircle;
    return (LucideIcons as any)[iconName] || HelpCircle;
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Funcionalidades</h1>
            <p className="text-muted-foreground mt-1">
              Configure as funcionalidades exibidas na seção "Features" da Landing Page.
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateFeature}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Funcionalidade
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionalidade por título ou descrição..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Features List */}
        {isLoading ? (
          <DataTableSkeleton variant="table" columns={4} />
        ) : filteredFeatures.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhuma funcionalidade encontrada" : "Nenhuma funcionalidade cadastrada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Cadastre as funcionalidades para a Landing Page."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateFeature}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Funcionalidade
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Ícone</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Título</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Descrição</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Ordem</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeatures.map((feature) => {
                      const Icon = getIconComponent(feature.icon);
                      return (
                        <tr key={feature.id} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">
                            <Icon className="h-5 w-5 text-primary" />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{feature.title}</td>
                          <td className="px-4 py-3 text-sm max-w-xs truncate">{feature.description}</td>
                          <td className="px-4 py-3 text-sm">{feature.display_order}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditFeature(feature)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(feature.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feature Dialog */}
      <FeatureDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        feature={selectedFeature}
        onSubmit={handleSubmit}
        isLoading={createFeature.isPending || updateFeature.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta funcionalidade? Esta ação não pode ser desfeita.
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

export default AdminFeaturesPage;