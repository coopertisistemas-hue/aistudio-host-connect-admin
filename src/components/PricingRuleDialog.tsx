import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PricingRule, PricingRuleInput, pricingRuleSchema } from "@/hooks/usePricingRules";
import { useProperties } from "@/hooks/useProperties";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface PricingRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pricingRule?: PricingRule | null;
  onSubmit: (data: PricingRuleInput) => void;
  isLoading?: boolean;
  initialPropertyId?: string;
}

const PricingRuleDialog = ({ open, onOpenChange, pricingRule, onSubmit, isLoading, initialPropertyId }: PricingRuleDialogProps) => {
  const { properties } = useProperties();
  const form = useForm<PricingRuleInput>({
    resolver: zodResolver(pricingRuleSchema),
    defaultValues: {
      property_id: initialPropertyId || "",
      room_type_id: null,
      start_date: new Date(),
      end_date: new Date(),
      base_price_override: null,
      price_modifier: null,
      min_stay: 1,
      max_stay: null,
      promotion_name: "",
      status: "active",
    },
  });

  const selectedPropertyId = form.watch("property_id");
  const { roomTypes: availableRoomTypes } = useRoomTypes(selectedPropertyId);

  useEffect(() => {
    if (pricingRule) {
      form.reset({
        property_id: pricingRule.property_id,
        room_type_id: pricingRule.room_type_id,
        start_date: new Date(pricingRule.start_date),
        end_date: new Date(pricingRule.end_date),
        base_price_override: pricingRule.base_price_override || null,
        price_modifier: pricingRule.price_modifier || null,
        min_stay: pricingRule.min_stay || 1,
        max_stay: pricingRule.max_stay || null,
        promotion_name: pricingRule.promotion_name || "",
        status: pricingRule.status,
      });
    } else {
      form.reset({
        property_id: initialPropertyId || (properties.length > 0 ? properties[0].id : ""),
        room_type_id: null,
        start_date: new Date(),
        end_date: new Date(),
        base_price_override: null,
        price_modifier: null,
        min_stay: 1,
        max_stay: null,
        promotion_name: "",
        status: "active",
      });
    }
  }, [pricingRule, open, properties, form, initialPropertyId]);

  const handleFormSubmit = (data: PricingRuleInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pricingRule ? "Editar Regra de Precificação" : "Nova Regra de Precificação"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-full">
              <Label htmlFor="property_id">Propriedade *</Label>
              <Controller
                name="property_id"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("room_type_id", null); // Reset room type when property changes
                    }}
                    disabled={properties.length === 0 || !!initialPropertyId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma propriedade" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name} - {property.city}
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

            <div className="col-span-full">
              <Label htmlFor="room_type_id">Tipo de Acomodação (Opcional)</Label>
              <Controller
                name="room_type_id"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={(value) => field.onChange(value === "" ? null : value)}
                    disabled={!selectedPropertyId || availableRoomTypes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aplicar a todos os tipos ou selecione um" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os Tipos</SelectItem>
                      {availableRoomTypes.map((roomType) => (
                        <SelectItem key={roomType.id} value={roomType.id}>
                          {roomType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.room_type_id && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.room_type_id.message}
                </p>
              )}
            </div>

            <div>
              <Label>Data de Início *</Label>
              <Controller
                name="start_date"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.start_date && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.start_date.message}
                </p>
              )}
            </div>

            <div>
              <Label>Data de Término *</Label>
              <Controller
                name="end_date"
                control={form.control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < (form.getValues("start_date") || new Date())}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.end_date && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.end_date.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="base_price_override">Preço Base (R$)</Label>
              <Input
                id="base_price_override"
                type="number"
                step="0.01"
                placeholder="Ex: 150.00"
                {...form.register("base_price_override", { valueAsNumber: true })}
              />
              {form.formState.errors.base_price_override && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.base_price_override.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Define um preço fixo para o período.
              </p>
            </div>

            <div>
              <Label htmlFor="price_modifier">Modificador de Preço (%)</Label>
              <Input
                id="price_modifier"
                type="number"
                step="0.01"
                placeholder="Ex: 1.10 para +10%, 0.90 para -10%"
                {...form.register("price_modifier", { valueAsNumber: true })}
              />
              {form.formState.errors.price_modifier && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.price_modifier.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Multiplicador sobre o preço base (ex: 1.10 para +10%, 0.90 para -10%).
              </p>
            </div>

            <div>
              <Label htmlFor="min_stay">Estadia Mínima (noites)</Label>
              <Input
                id="min_stay"
                type="number"
                min="1"
                placeholder="Ex: 2"
                {...form.register("min_stay", { valueAsNumber: true })}
              />
              {form.formState.errors.min_stay && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.min_stay.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="max_stay">Estadia Máxima (noites)</Label>
              <Input
                id="max_stay"
                type="number"
                min="1"
                placeholder="Ex: 7"
                {...form.register("max_stay", { valueAsNumber: true })}
              />
              {form.formState.errors.max_stay && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.max_stay.message}
                </p>
              )}
            </div>

            <div className="col-span-full">
              <Label htmlFor="promotion_name">Nome da Promoção/Regra</Label>
              <Input
                id="promotion_name"
                placeholder="Ex: Feriado de Natal, Promoção de Inverno"
                {...form.register("promotion_name")}
              />
              {form.formState.errors.promotion_name && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.promotion_name.message}
                </p>
              )}
            </div>

            <div className="col-span-full">
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
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="hero" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {pricingRule ? "Salvar Alterações" : "Criar Regra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PricingRuleDialog;