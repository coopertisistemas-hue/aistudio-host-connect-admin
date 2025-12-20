import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Feature, FeatureInput, featureSchema } from "@/hooks/useFeatures";
import { Loader2, Zap, HelpCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface FeatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: Feature | null;
  onSubmit: (data: FeatureInput) => void;
  isLoading?: boolean;
}

const FeatureDialog = ({ open, onOpenChange, feature, onSubmit, isLoading }: FeatureDialogProps) => {
  const form = useForm<FeatureInput>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "",
      display_order: 0,
    },
  });

  useEffect(() => {
    if (feature) {
      form.reset({
        title: feature.title,
        description: feature.description,
        icon: feature.icon || "",
        display_order: feature.display_order || 0,
      });
    } else {
      form.reset();
    }
  }, [feature, open, form]);

  const handleFormSubmit = (data: FeatureInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{feature ? "Editar Funcionalidade" : "Nova Funcionalidade"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Gestão de Reservas Inteligente"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Uma breve descrição da funcionalidade."
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ícone (Nome do Lucide Icon)</Label>
            <Input
              id="icon"
              placeholder="Ex: Calendar, CreditCard, BarChart3"
              {...form.register("icon")}
            />
            <p className="text-xs text-muted-foreground">
              Use nomes de ícones da biblioteca Lucide React (ex: `Calendar`, `CreditCard`).
            </p>
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

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {feature ? "Salvar Alterações" : "Criar Funcionalidade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureDialog;