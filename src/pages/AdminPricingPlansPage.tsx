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
import { Plus, Search, DollarSign, Tag, Edit, Trash2, Loader2 } from "lucide-react";
import { usePricingPlans, PricingPlan, PricingPlanInput } from "@/hooks/usePricingPlans";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import PricingPlanDialog from "@/components/admin/PricingPlanDialog";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AdminPricingPlansPage = () => {
  const { isAdmin, loading: authLoading } = useIsAdmin();
  const navigate = useNavigate();
  
  const { plans, isLoading, createPlan, updatePlan, deletePlan } = usePricingPlans();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, authLoading, navigate]);

  const filteredPlans = plans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setDialogOpen(true);
  };

  const handleEditPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: PricingPlanInput) => {
    if (selectedPlan) {
      await updatePlan.mutateAsync({ id: selectedPlan.id, plan: data });
    } else {
      await createPlan.mutateAsync(data);
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setPlanToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (planToDelete) {
      await deletePlan.mutateAsync(planToDelete);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
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
            <h1 className="text-3xl font-bold">Gerenciar Planos de Preços</h1>
            <p className="text-muted-foreground mt-1">
              Configure os planos de assinatura exibidos na Landing Page.
            </p>
          </div>
          <Button variant="hero" onClick={handleCreatePlan}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar plano por nome ou descrição..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Plans List */}
        {isLoading ? (
          <DataTableSkeleton variant="table" columns={5} />
        ) : filteredPlans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhum plano encontrado" : "Nenhum plano cadastrado"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Cadastre os planos de assinatura para a Landing Page."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreatePlan}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Plano
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
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Nome</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Preço</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Comissão</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">Popular</th>
                      <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="border-b last:border-b-0 hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm font-medium">{plan.name}</td>
                        <td className="px-4 py-3 text-sm">R$ {plan.price.toFixed(2)} {plan.period}</td>
                        <td className="px-4 py-3 text-sm">{plan.commission.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-sm">
                          {plan.is_popular && <Badge variant="default" className="bg-accent hover:bg-accent/80">Sim</Badge>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditPlan(plan)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(plan.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pricing Plan Dialog */}
      <PricingPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        plan={selectedPlan}
        onSubmit={handleSubmit}
        isLoading={createPlan.isPending || updatePlan.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este plano de preço? Esta ação não pode ser desfeita.
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

export default AdminPricingPlansPage;