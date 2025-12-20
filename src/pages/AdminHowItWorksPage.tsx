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
import { Plus, Search, Zap, Edit, Trash2, ListOrdered } from "lucide-react";
import { useHowItWorksSteps, HowItWorksStep, HowItWorksStepInput } from "@/hooks/useHowItWorksSteps";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import HowItWorksStepDialog from "@/components/admin/HowItWorksStepDialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";

const AdminHowItWorksPage = () => {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const navigate = useNavigate();
  
  const { steps, isLoading, createStep, updateStep, deleteStep } = useHowItWorksSteps();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<HowItWorksStep | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, authLoading, navigate]);

  const filteredSteps = steps.filter((step) =>
    step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    step.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateStep = () => {
    setSelectedStep(null);
    setDialogOpen(true);
  };

  const handleEditStep = (step: HowItWorksStep) => {
    setSelectedStep(step);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: HowItWorksStepInput) => {
    if (selectedStep) {
      await updateStep.mutateAsync({ id: selectedStep.id, step: data });
    } else {
      await createStep.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setStepToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (stepToDelete) {
      await deleteStep.mutateAsync(stepToDelete);
      setDeleteDialogOpen(false);
      setStepToDelete(null);
    }
  };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return Zap;
    return (LucideIcons as any)[iconName] || Zap;
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
            <h1 className="text-3xl font-bold">Gerenciar Passos "Como Funciona"</h1>
            <p className="text-muted-foreground mt-1">
              Configure os passos exibidos na seção "How It Works" da Landing Page.
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateStep}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Passo
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar passo por título ou descrição..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Steps List */}
        {isLoading ? (
          <DataTableSkeleton variant="table" columns={4} />
        ) : filteredSteps.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ListOrdered className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhum passo encontrado" : "Nenhum passo cadastrado"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Cadastre os passos para a seção 'Como Funciona'."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateStep}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Passo
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
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Título</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Descrição (Preview)</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Ícone</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSteps.map((step) => {
                      const Icon = getIconComponent(step.icon);
                      return (
                        <tr key={step.id} className="border-b last:border-b-0 hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm font-bold">{step.step_number}</td>
                          <td className="px-4 py-3 text-sm font-medium">{step.title}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate">{step.description}</td>
                          <td className="px-4 py-3 text-sm">
                            <Icon className="h-5 w-5 text-primary" />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditStep(step)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(step.id)}>
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

      {/* Step Dialog */}
      <HowItWorksStepDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        step={selectedStep}
        onSubmit={handleSubmit}
        isLoading={createStep.isPending || updateStep.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este passo? Esta ação não pode ser desfeita.
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

export default AdminHowItWorksPage;