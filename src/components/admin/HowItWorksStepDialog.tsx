import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HowItWorksStep, HowItWorksStepInput, howItWorksStepSchema } from "@/hooks/useHowItWorksSteps";
import { Loader2, Zap, HelpCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface HowItWorksStepDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step?: HowItWorksStep | null;
  onSubmit: (data: HowItWorksStepInput) => void;
  isLoading?: boolean;
}

const HowItWorksStepDialog = ({ open, onOpenChange, step, onSubmit, isLoading }: HowItWorksStepDialogProps) => {
  const form = useForm<HowItWorksStepInput>({
    resolver: zodResolver(howItWorksStepSchema),
    defaultValues: {
      step_number: 1,
      title: "",
      description: "",
      icon: "",
    },
  });

  useEffect(() => {
    if (step) {
      form.reset({
        step_number: step.step_number,
        title: step.title,
        description: step.description,
        icon: step.icon || "",
      });
    } else {
      form.reset();
    }
  }, [step, open, form]);

  const handleFormSubmit = (data: HowItWorksStepInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{step ? "Editar Passo" : "Novo Passo"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="step_number">Número do Passo *</Label>
              <Input
                id="step_number"
                type="number"
                min="1"
                {...form.register("step_number", { valueAsNumber: true })}
              />
              {form.formState.errors.step_number && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.step_number.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Cadastre sua Propriedade"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              placeholder="Descreva o que o usuário deve fazer neste passo."
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
            <Label htmlFor="icon">Ícone (Nome do Lucide Icon - Opcional)</Label>
            <Input
              id="icon"
              placeholder="Ex: Home, Calendar, DollarSign"
              {...form.register("icon")}
            />
            <p className="text-xs text-muted-foreground">
              Use nomes de ícones da biblioteca Lucide React.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step ? "Salvar Alterações" : "Criar Passo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorksStepDialog;