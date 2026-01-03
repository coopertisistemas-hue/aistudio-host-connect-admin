import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Service, ServiceInput, serviceSchema } from "@/hooks/useServices";
import { useProperties } from "@/hooks/useProperties";
import { Loader2, DollarSign, Users, CalendarDays } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSubmit: (data: ServiceInput) => void;
  isLoading?: boolean;
  initialPropertyId?: string;
}

const ServiceDialog = ({ open, onOpenChange, service, onSubmit, isLoading, initialPropertyId }: ServiceDialogProps) => {
  const { properties } = useProperties();
  const form = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      property_id: initialPropertyId || "",
      name: "",
      description: "",
      price: 0,
      is_per_person: false,
      is_per_day: false,
      status: "active",
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        property_id: service.property_id,
        name: service.name,
        description: service.description || "",
        price: service.price,
        is_per_person: service.is_per_person,
        is_per_day: service.is_per_day,
        status: service.status,
      });
    } else {
      form.reset({
        property_id: initialPropertyId || (properties.length > 0 ? properties[0].id : ""),
        name: "",
        description: "",
        price: 0,
        is_per_person: false,
        is_per_day: false,
        status: "active",
      });
    }
  }, [service, open, form, properties, initialPropertyId]);

  const handleFormSubmit = (data: ServiceInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          <DialogDescription className="sr-only">
            {service ? "Edite os detalhes do serviço." : "Cadastre um novo serviço para sua propriedade."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="property_id">Propriedade *</Label>
            <Controller
              name="property_id"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={properties.length === 0 || !!initialPropertyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma propriedade" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((prop) => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.property_id && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.property_id.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Serviço *</Label>
            <Input
              id="name"
              placeholder="Ex: Café da Manhã, Transfer Aeroporto"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Uma breve descrição do serviço."
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

          <div className="flex items-center space-x-2">
            <Controller
              name="is_per_person"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="is_per_person"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="is_per_person" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <Users className="h-4 w-4 text-muted-foreground" />
              Preço por pessoa
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="is_per_day"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="is_per_day"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <Label htmlFor="is_per_day" className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Preço por dia
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.status && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.status.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {service ? "Salvar Alterações" : "Criar Serviço"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDialog;