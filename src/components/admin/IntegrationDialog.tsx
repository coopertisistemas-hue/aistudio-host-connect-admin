import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Integration, IntegrationInput, integrationSchema } from "@/hooks/useIntegrations";
import { Loader2, Zap, HelpCircle } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface IntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration?: Integration | null;
  onSubmit: (data: IntegrationInput) => void;
  isLoading?: boolean;
}

const IntegrationDialog = ({ open, onOpenChange, integration, onSubmit, isLoading }: IntegrationDialogProps) => {
  const form = useForm<IntegrationInput>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      name: "",
      icon: "",
      description: "",
      is_visible: true,
      display_order: 0,
    },
  });

  useEffect(() => {
    if (integration) {
      form.reset({
        name: integration.name,
        icon: integration.icon || "",
        description: integration.description || "",
        is_visible: integration.is_visible || true,
        display_order: integration.display_order || 0,
      });
    } else {
      form.reset();
    }
  }, [integration, open, form]);

  const handleFormSubmit = (data: IntegrationInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{integration ? "Editar Integração" : "Nova Integração"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Integração *</Label>
            <Input
              id="name"
              placeholder="Ex: Booking.com, Airbnb, Stripe"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ícone (Nome do Lucide Icon - Opcional)</Label>
            <Input
              id="icon"
              placeholder="Ex: Globe, Plane, CreditCard"
              {...form.register("icon")}
            />
            <p className="text-xs text-muted-foreground">
              Use nomes de ícones da biblioteca Lucide React.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Textarea
              id="description"
              placeholder="Uma breve descrição da integração."
              rows={3}
              {...form.register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                min="0"
                {...form.register("display_order", { valueAsNumber: true })}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Controller
                name="is_visible"
                control={form.control}
                render={({ field }) => (
                  <Checkbox
                    id="is_visible"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="is_visible" className="text-sm font-medium leading-none">
                Visível na Landing Page
              </Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {integration ? "Salvar Alterações" : "Criar Integração"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default IntegrationDialog;