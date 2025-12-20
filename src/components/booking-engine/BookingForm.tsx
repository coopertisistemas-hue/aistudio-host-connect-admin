import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ServiceMultiSelect from "@/components/ServiceMultiSelect";
import { useProperties } from "@/hooks/useProperties";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import { useServices } from "@/hooks/useServices";
import { useForm, Controller, UseFormReturn } from "react-hook-form";
import { BookingEngineInput } from "@/lib/booking-engine-schemas";

interface BookingFormProps {
  form: UseFormReturn<BookingEngineInput>;
  selectedPropertyId: string | undefined;
  setSelectedPropertyId: (id: string | undefined) => void;
  onSubmit: (data: BookingEngineInput) => void;
  isChecking: boolean;
  isCalculating: boolean;
  isBooking: boolean;
  urlPropertyId?: string;
}

const BookingForm = ({
  form,
  selectedPropertyId,
  setSelectedPropertyId,
  onSubmit,
  isChecking,
  isCalculating,
  isBooking,
  urlPropertyId,
}: BookingFormProps) => {
  const { properties, isLoading: propertiesLoading } = useProperties();
  const { roomTypes, isLoading: roomTypesLoading } = useRoomTypes(selectedPropertyId);
  const { services, isLoading: servicesLoading } = useServices(selectedPropertyId);

  const { watch, setValue, handleSubmit, formState: { errors } } = form;
  const watchedFields = watch();

  useEffect(() => {
    if (!propertiesLoading && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
      setValue("property_id", properties[0].id);
    } else if (urlPropertyId && properties.length > 0 && properties.some(p => p.id === urlPropertyId)) {
      setSelectedPropertyId(urlPropertyId);
      setValue("property_id", urlPropertyId);
    }
  }, [propertiesLoading, properties, selectedPropertyId, setValue, urlPropertyId, setSelectedPropertyId]);

  useEffect(() => {
    setValue("room_type_id", "");
    setValue("selected_services_ids", []);
  }, [selectedPropertyId, setValue]);

  const isFormValidForCheck = watchedFields.property_id && watchedFields.room_type_id && watchedFields.check_in && watchedFields.check_out && watchedFields.total_guests > 0;

  return (
    <Card className="p-6 space-y-6">
      <CardHeader className="p-0">
        <CardTitle className="text-2xl">1. Detalhes da Acomodação</CardTitle>
        <CardDescription>Selecione a propriedade, tipo de quarto e datas.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="property_id">Propriedade *</Label>
          <Controller
            name="property_id"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedPropertyId(value);
                }}
                disabled={propertiesLoading || properties.length === 0 || isChecking || isCalculating || isBooking || !!urlPropertyId}
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
          {errors.property_id && <p className="text-destructive text-sm mt-1">{errors.property_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="room_type_id">Tipo de Acomodação *</Label>
          <Controller
            name="room_type_id"
            control={form.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!selectedPropertyId || roomTypesLoading || roomTypes.length === 0 || isChecking || isCalculating || isBooking}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de acomodação" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((roomType) => (
                    <SelectItem key={roomType.id} value={roomType.id}>
                      {roomType.name} (Capacidade: {roomType.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.room_type_id && <p className="text-destructive text-sm mt-1">{errors.room_type_id.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Check-in *</Label>
            <Controller
              name="check_in"
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
                      disabled={isChecking || isCalculating || isBooking}
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
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.check_in && <p className="text-destructive text-sm mt-1">{errors.check_in.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Check-out *</Label>
            <Controller
              name="check_out"
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
                      disabled={isChecking || isCalculating || isBooking}
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
                      disabled={(date) => date < (watchedFields.check_in || new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.check_out && <p className="text-destructive text-sm mt-1">{errors.check_out.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_guests">Número de Hóspedes *</Label>
          <Input
            id="total_guests"
            type="number"
            min="1"
            max="10"
            {...form.register("total_guests", { valueAsNumber: true })}
            disabled={isChecking || isCalculating || isBooking}
          />
          {errors.total_guests && <p className="text-destructive text-sm mt-1">{errors.total_guests.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="selected_services_ids">Serviços Adicionais</Label>
          <Controller
            name="selected_services_ids"
            control={form.control}
            render={({ field }) => (
              <ServiceMultiSelect
                propertyId={watchedFields.property_id}
                value={field.value || []}
                onChange={field.onChange}
                disabled={!watchedFields.property_id || servicesLoading || isChecking || isCalculating || isBooking}
              />
            )}
          />
          {errors.selected_services_ids && <p className="text-destructive text-sm mt-1">{errors.selected_services_ids.message}</p>}
          {!watchedFields.property_id && (
            <p className="text-xs text-muted-foreground mt-1">
              Selecione uma propriedade para ver os serviços disponíveis.
            </p>
          )}
        </div>

        <Button
          onClick={handleSubmit(onSubmit)}
          disabled={!isFormValidForCheck || isChecking || isCalculating || isBooking}
          className="w-full"
        >
          {(isChecking || isCalculating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isChecking ? "Verificando..." : isCalculating ? "Calculando Preço..." : "Verificar Disponibilidade e Preço"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingForm;