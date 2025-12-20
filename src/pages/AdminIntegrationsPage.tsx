import { useState, useEffect } from "react";
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
import { Plus, Search, Globe, Edit, Trash2, Eye, EyeOff, HelpCircle } from "lucide-react";
import { useIntegrations, Integration, IntegrationInput } from "@/hooks/useIntegrations";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import IntegrationDialog from "@/components/admin/IntegrationDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";

const AdminIntegrationsPage = () => {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const navigate = useNavigate();
  
  const { integrations, isLoading, createIntegration, updateIntegration, deleteIntegration } = useIntegrations();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [integrationToDelete, setIntegrationToDelete] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, authLoading, navigate]);

  const filteredIntegrations = integrations.filter((integration) =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateIntegration = () => {
    setSelectedIntegration(null);
    setDialogOpen(true);
  };

  const handleEditIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: IntegrationInput) => {
    if (selectedIntegration) {
      await updateIntegration.mutateAsync({ id: selectedIntegration.id, integration: data });
    } else {
      await createIntegration.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setIntegrationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (integrationToDelete) {
      await deleteIntegration.mutateAsync(integrationToDelete);
      setDeleteDialogOpen(false);
      setIntegrationToDelete(null);
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
            <h1 className="text-3xl font-bold">Gerenciar Integrações</h1>
            <p className="text-muted-foreground mt-1">
              Configure as integrações exibidas na seção "Integrations" da Landing Page.
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateIntegration}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Integração
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar integração por nome ou descrição..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Integrations List */}
        {isLoading ? (
          <DataTableSkeleton variant="table" columns={5} />
        ) : filteredIntegrations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhuma integração encontrada" : "Nenhuma integração cadastrada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Cadastre as integrações para exibir na Landing Page."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateIntegration}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Integração
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
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Nome</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Descrição (Preview)</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Visível</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIntegrations.map((integration) => {
                      const Icon = getIconComponent(integration.icon);
                      return (
                        <tr key={integration.id} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">
                            <Icon className="h-5 w-5 text-primary" />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{integration.name}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{integration.description}</td>
                          <td className="px-4 py-3 text-sm">
                            {integration.is_visible ? (
                              <Badge variant="default" className="bg-success hover:bg-success/80 flex items-center gap-1">
                                <Eye className="h-3 w-3" /> Sim
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <EyeOff className="h-3 w-3" /> Não
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditIntegration(integration)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(integration.id)}>
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

      {/* Integration Dialog */}
      <IntegrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        integration={selectedIntegration}
        onSubmit={handleSubmit}
        isLoading={createIntegration.isPending || updateIntegration.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta integração? Esta ação não pode ser desfeita.
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

export default AdminIntegrationsPage;