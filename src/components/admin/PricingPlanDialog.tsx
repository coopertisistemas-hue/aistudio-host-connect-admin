import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PricingPlan, PricingPlanInput, pricingPlanSchema } from "@/hooks/usePricingPlans";
import { Loader2, CheckCircle2, Plus, X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";

interface PricingPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: PricingPlan | null;
  onSubmit: (data: PricingPlanInput) => void;
  isLoading?: boolean;
}

const PricingPlanDialog = ({ open, onOpenChange, plan, onSubmit, isLoading }: PricingPlanDialogProps) => {
  const form = useForm<PricingPlanInput>({
    resolver: zodResolver(pricingPlanSchema),
    defaultValues: {
      name: "",
      price: 0,
      commission: 0,
      period: "/mês",
      description: "",
      is_popular: false,
      display_order: 0,
      features: [],
    },
  });

  const [featureInput, setFeatureInput] = useState("");
  const watchedFeatures = form.watch("features") || [];

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        price: plan.price,
        commission: plan.commission,
        period: plan.period,
        description: plan.description || "",
        is_popular: plan.is_popular || false,
        display_order: plan.display_order || 0,
        features: plan.features || [],
      });
    } else {
      form.reset();
    }
  }, [plan, open, form]);

  const handleFormSubmit = (data: PricingPlanInput) => {
    onSubmit(data);
  };

  const addFeature = () => {
    if (featureInput.trim() && !watchedFeatures.includes(featureInput.trim())) {
      form.setValue("features", [...watchedFeatures, featureInput.trim()], { shouldValidate: true });
      setFeatureInput("");
    }
  };

  const removeFeature = (featureToRemove: string) => {
    form.setValue("features", watchedFeatures.filter(f => f !== featureToRemove), { shouldValidate: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar Plano de Preço" : "Novo Plano de Preço"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Nome do Plano *</Label>
              <Input
                id="name"
                placeholder="Ex: Essencial, Profissional"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                {...form.register("price", { valueAsNumber: true })}
              />
              {form.formState.errors.price && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission">Comissão (%) *</Label>
              <Input
                id="commission"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...form.register("commission", { valueAsNumber: true })}
              />
              {form.formState.errors.commission && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.commission.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Período *</Label>
              <Input
                id="period"
                placeholder="/mês"
                {...form.register("period")}
              />
              {form.formState.errors.period && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.period.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                {...form.register("display_order", { valueAsNumber: true })}
              />
            </div>

            <div className="col-span-2 flex items-center space-x-2 pt-2">
              <Controller
                name="is_popular"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="is_popular"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_popular" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Marcar como "Mais Popular"
              </Label>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Uma breve descrição do plano."
                rows={2}
                {...form.register("description")}
              />
            </div>

            {/* Features List */}
            <div className="col-span-2 space-y-3 border-t pt-4">
              <Label>Funcionalidades (Uma por linha)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nova funcionalidade..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="icon" onClick={addFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 border rounded-md">
                {watchedFeatures.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">Adicione funcionalidades acima.</p>
                ) : (
                  watchedFeatures.map((feature, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {feature}
                      <button
                        type="button"
                        onClick={() => removeFeature(feature)}
                        className="ml-1 -mr-1 h-3 w-3 rounded-full bg-muted-foreground/20 hover:bg-muted-foreground/40 flex items-center justify-center"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              {form.formState.errors.features && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.features.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {plan ? "Salvar Alterações" : "Criar Plano"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PricingPlanDialog;