import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Room, RoomInput, roomSchema } from "@/hooks/useRooms";
import { Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProperties } from "@/hooks/useProperties";
import { useRoomTypes } from "@/hooks/useRoomTypes";

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSubmit: (data: RoomInput) => void;
  isLoading?: boolean;
  initialPropertyId?: string;
}

const RoomDialog = ({ open, onOpenChange, room, onSubmit, isLoading, initialPropertyId }: RoomDialogProps) => {
  const { properties } = useProperties();
  const { roomTypes } = useRoomTypes(room?.property_id || initialPropertyId);

  const form = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      property_id: initialPropertyId || "",
      room_type_id: "",
      room_number: "",
      status: "available",
    },
  });

  useEffect(() => {
    if (room) {
      form.reset({
        property_id: room.property_id,
        room_type_id: room.room_type_id,
        room_number: room.room_number,
        status: room.status as RoomInput['status'], // Cast to correct enum type
      });
    } else {
      form.reset({
        property_id: initialPropertyId || (properties.length > 0 ? properties[0].id : ""),
        room_type_id: "",
        room_number: "",
        status: "available",
      });
    }
  }, [room, open, form, properties, initialPropertyId]);

  const handleFormSubmit = (data: RoomInput) => {
    onSubmit(data);
  };

  const selectedPropertyId = form.watch("property_id");
  const { roomTypes: availableRoomTypes } = useRoomTypes(selectedPropertyId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{room ? "Editar Quarto" : "Novo Quarto"}</DialogTitle>
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
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("room_type_id", ""); // Reset room type when property changes
                  }}
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
            <Label htmlFor="room_type_id">Tipo de Acomodação *</Label>
            <Controller
              name="room_type_id"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!selectedPropertyId || availableRoomTypes.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de acomodação" />
                  </SelectTrigger>
                  <SelectContent>
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

          <div className="space-y-2">
            <Label htmlFor="room_number">Número/Nome do Quarto *</Label>
            <Input
              id="room_number"
              placeholder="Ex: 101, Suíte Master"
              {...form.register("room_number")}
            />
            {form.formState.errors.room_number && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.room_number.message}
              </p>
            )}
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
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="occupied">Ocupado</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
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
              {room ? "Salvar Alterações" : "Criar Quarto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoomDialog;