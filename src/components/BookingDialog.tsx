import { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Booking, BookingInput, bookingSchema } from "@/hooks/useBookings";
import { useProperties } from "@/hooks/useProperties";
import { useRoomTypes } from "@/hooks/useRoomTypes";
import ServiceMultiSelect from "@/components/ServiceMultiSelect";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBookingEngine } from "@/hooks/useBookingEngine";
import { useRooms } from "@/hooks/useRooms";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: Booking | null;
  onSubmit: (data: BookingInput) => void;
  isLoading?: boolean;
}

const BookingDialog = ({ open, onOpenChange, booking, onSubmit, isLoading }: BookingDialogProps) => {
  const { properties } = useProperties();
  const { calculatePrice } = useBookingEngine();
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      property_id: "",
      room_type_id: "",
      guest_name: "",
      guest_email: "",
      guest_phone: "",
      check_in: new Date(),
      check_out: new Date(Date.now() + 86400000), // +1 day
      total_guests: 1,
      total_amount: 0,
      status: "pending",
      notes: "",
      services_json: [], // Default para array vazio
      current_room_id: null, // Default para null
    },
  });

  const selectedPropertyId = form.watch("property_id");
  const selectedRoomTypeId = form.watch("room_type_id");
  const { roomTypes: availableRoomTypes } = useRoomTypes(selectedPropertyId);
  const { data: allRooms = [] } = useRooms(selectedPropertyId);

  const filteredRooms = allRooms.filter(r => r.room_type_id === selectedRoomTypeId);
  const watchedFields = form.watch();

  useEffect(() => {
    if (booking) {
      form.reset({
        property_id: booking.property_id,
        room_type_id: booking.room_type_id,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone || "",
        check_in: new Date(booking.check_in),
        check_out: new Date(booking.check_out),
        total_guests: booking.total_guests,
        total_amount: booking.total_amount,
        status: booking.status as BookingInput['status'], // Cast to correct enum type
        notes: booking.notes || "",
        services_json: booking.services_json || [], // Carregar serviços existentes
        current_room_id: booking.current_room_id || null, // Carregar current_room_id
      });
    } else {
      form.reset({
        property_id: properties.length > 0 ? properties[0].id : "",
        room_type_id: "",
        guest_name: "",
        guest_email: "",
        guest_phone: "",
        check_in: new Date(),
        check_out: new Date(Date.now() + 86400000),
        total_guests: 1,
        total_amount: 0,
        status: "pending",
        notes: "",
        services_json: [],
        current_room_id: null,
      });
    }
  }, [booking, open, properties, form]);

  const handleFormSubmit = (data: BookingInput) => {
    onSubmit(data);
  };

  const handleCalculatePrice = async () => {
    const { property_id, room_type_id, check_in, check_out, total_guests, services_json } = watchedFields;

    if (!property_id || !room_type_id || !check_in || !check_out || total_guests <= 0 || differenceInDays(check_out, check_in) <= 0) {
      form.setError("total_amount", { message: "Preencha todos os campos de data, propriedade, tipo de quarto e hóspedes antes de calcular." });
      return;
    }

    form.clearErrors("total_amount");
    setIsCalculating(true);

    try {
      const priceData = {
        property_id,
        room_type_id,
        check_in: format(check_in, 'yyyy-MM-dd'),
        check_out: format(check_out, 'yyyy-MM-dd'),
        total_guests,
        selected_services_ids: services_json || [],
      };

      const priceResponse = await calculatePrice.mutateAsync(priceData);

      form.setValue("total_amount", priceResponse.total_amount, { shouldValidate: true });
    } catch (error: any) {
      form.setError("total_amount", { message: error.message || "Erro ao calcular preço." });
    } finally {
      setIsCalculating(false);
    }
  };

  const isPriceCalculationReady = watchedFields.property_id && watchedFields.room_type_id && watchedFields.check_in && watchedFields.check_out && watchedFields.total_guests > 0 && differenceInDays(watchedFields.check_out, watchedFields.check_in) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{booking ? "Editar Reserva" : "Nova Reserva"}</DialogTitle>
          <DialogDescription>
            {booking ? "Atualize as informações da reserva" : "Cadastre uma nova reserva"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="property_id">Propriedade *</Label>
              <Controller
                name="property_id"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("room_type_id", ""); // Reset room type when property changes
                      form.setValue("services_json", []); // Reset services when property changes
                      form.setValue("total_amount", 0); // Reset amount
                    }}
                    disabled={properties.length === 0 || isLoading || isCalculating}
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

            <div className="col-span-2">
              <Label htmlFor="room_type_id">Tipo de Acomodação *</Label>
              <Controller
                name="room_type_id"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("total_amount", 0); // Reset amount
                    }}
                    disabled={!selectedPropertyId || availableRoomTypes.length === 0 || isLoading || isCalculating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de acomodação" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoomTypes.map((roomType) => (
                        <SelectItem key={roomType.id} value={roomType.id}>
                          {roomType.name} (Capacidade: {roomType.capacity})
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

            <div className="col-span-2">
              <Label htmlFor="guest_name">Nome do Hóspede *</Label>
              <Input
                id="guest_name"
                placeholder="João Silva"
                {...form.register("guest_name")}
                disabled={isLoading || isCalculating}
              />
              {form.formState.errors.guest_name && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.guest_name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="guest_email">Email do Hóspede *</Label>
              <Input
                id="guest_email"
                type="email"
                placeholder="joao@email.com"
                {...form.register("guest_email")}
                disabled={isLoading || isCalculating}
              />
              {form.formState.errors.guest_email && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.guest_email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="guest_phone">Telefone</Label>
              <Input
                id="guest_phone"
                type="tel"
                placeholder="(49) 99999-9999"
                {...form.register("guest_phone")}
                disabled={isLoading || isCalculating}
              />
              {form.formState.errors.guest_phone && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.guest_phone.message}
                </p>
              )}
            </div>

            <div>
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
                        disabled={isLoading || isCalculating}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          form.setValue("total_amount", 0); // Reset amount
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.check_in && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.check_in.message}
                </p>
              )}
            </div>

            <div>
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
                        disabled={isLoading || isCalculating}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : "Selecione"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          form.setValue("total_amount", 0); // Reset amount
                        }}
                        disabled={(date) => date < (form.getValues("check_in") || new Date())}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {form.formState.errors.check_out && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.check_out.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="total_guests">Número de Hóspedes *</Label>
              <Input
                id="total_guests"
                type="number"
                min="1"
                {...form.register("total_guests", {
                  valueAsNumber: true,
                  onChange: () => form.setValue("total_amount", 0) // Reset amount on change
                })}
                disabled={isLoading || isCalculating}
              />
              {form.formState.errors.total_guests && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.total_guests.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_amount">Valor Total (R$) *</Label>
              <div className="flex gap-2">
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register("total_amount", { valueAsNumber: true })}
                  disabled={isLoading || isCalculating}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={handleCalculatePrice}
                  disabled={!isPriceCalculationReady || isCalculating || isLoading}
                  title="Calcular Preço"
                >
                  {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                </Button>
              </div>
              {form.formState.errors.total_amount && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.total_amount.message}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading || isCalculating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
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

            <div className="col-span-2">
              <Label htmlFor="current_room_id">Atribuição de Quarto</Label>
              <Controller
                name="current_room_id"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    disabled={isLoading || isCalculating || !selectedRoomTypeId}
                  >
                    <SelectTrigger className={cn(!field.value && "border-amber-500 bg-amber-50/50")}>
                      <SelectValue placeholder="Selecione um quarto (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem quarto definido</SelectItem>
                      {filteredRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Quarto {room.room_number} ({room.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {!form.watch("current_room_id") && (
                <p className="text-amber-600 text-[10px] mt-1 font-medium italic">
                  * Recomendado para check-in. Pode ser definido depois no Folio.
                </p>
              )}
            </div>

            <div className="col-span-2 border-t pt-4 mt-4">
              <Label htmlFor="services_json">Serviços Adicionais</Label>
              <Controller
                name="services_json"
                control={form.control}
                render={({ field }) => (
                  <ServiceMultiSelect
                    propertyId={selectedPropertyId}
                    value={field.value || []}
                    onChange={(value) => {
                      field.onChange(value);
                      form.setValue("total_amount", 0); // Reset amount
                    }}
                    disabled={isLoading || isCalculating || !selectedPropertyId}
                  />
                )}
              />
              {form.formState.errors.services_json && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.services_json.message}
                </p>
              )}
              {!selectedPropertyId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione uma propriedade para adicionar serviços.
                </p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre a reserva..."
                rows={3}
                {...form.register("notes")}
                disabled={isLoading || isCalculating}
              />
              {form.formState.errors.notes && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.notes.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading || isCalculating}>
              Cancelar
            </Button>
            <Button type="submit" variant="hero" disabled={isLoading || isCalculating || !form.formState.isValid}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {booking ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDialog;