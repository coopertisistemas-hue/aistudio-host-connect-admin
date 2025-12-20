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
import { Plus, Search, DollarSign, Home } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import PricingRuleDialog from "@/components/PricingRuleDialog";
import PricingRuleCard from "@/components/PricingRuleCard";
import { usePricingRules, PricingRule, PricingRuleInput } from "@/hooks/usePricingRules";
import { useProperties } from "@/hooks/useProperties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataTableSkeleton from "@/components/DataTableSkeleton";
import { useSelectedProperty } from "@/hooks/useSelectedProperty"; // NEW IMPORT

const PricingRulesPage = () => {
  const { properties } = useProperties();
  const { selectedPropertyId, setSelectedPropertyId, isLoading: propertyStateLoading } = useSelectedProperty();
  
  const { pricingRules, isLoading, createPricingRule, updatePricingRule, deletePricingRule } = usePricingRules(selectedPropertyId);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPricingRule, setSelectedPricingRule] = useState<PricingRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const filteredPricingRules = pricingRules.filter((rule) =>
    rule.promotion_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.properties?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.room_types?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateRule = () => {
    setSelectedPricingRule(null);
    setDialogOpen(true);
  };

  const handleEditRule = (rule: PricingRule) => {
    setSelectedPricingRule(rule);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: PricingRuleInput) => {
    if (!selectedPropertyId) {
      console.error("No property selected for pricing rule operation.");
      return;
    }

    if (selectedPricingRule) {
      await updatePricingRule.mutateAsync({ id: selectedPricingRule.id, rule: data });
    } else {
      await createPricingRule.mutateAsync({ ...data, property_id: selectedPropertyId });
    }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string) => {
    setRuleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (ruleToDelete) {
      await deletePricingRule.mutateAsync(ruleToDelete);
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const isDataLoading = isLoading || propertyStateLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Regras de Precificação</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie regras de preços, promoções e estadias mínimas/máximas
            </p>
          </div>
          <Button variant="hero" onClick={handleCreateRule} disabled={!selectedPropertyId}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Regra
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
              placeholder="Buscar regra por nome ou tipo de acomodação..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedPropertyId}
            />
          </div>
        </div>

        {/* Pricing Rules Grid */}
        {!selectedPropertyId ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade selecionada</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                Selecione uma propriedade acima para gerenciar suas regras de precificação.
              </p>
            </CardContent>
          </Card>
        ) : isDataLoading ? (
          <DataTableSkeleton />
        ) : filteredPricingRules.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "Nenhuma regra de precificação encontrada" : "Nenhuma regra de precificação cadastrada"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery
                  ? "Tente ajustar sua busca"
                  : "Comece cadastrando sua primeira regra de precificação para esta propriedade."}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreateRule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeira Regra
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPricingRules.map((rule) => (
              <PricingRuleCard
                key={rule.id}
                rule={rule}
                onEdit={handleEditRule}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pricing Rule Dialog */}
      <PricingRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pricingRule={selectedPricingRule}
        onSubmit={handleSubmit}
        isLoading={createPricingRule.isPending || updatePricingRule.isPending}
        initialPropertyId={selectedPropertyId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta regra de precificação? Esta ação não pode ser desfeita.
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

export default PricingRulesPage;