import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomType, RoomTypeInput, roomTypeSchema } from "@/hooks/useRoomTypes";
import PhotoGallery from "@/components/PhotoGallery";
import AmenityMultiSelect from "@/components/AmenityMultiSelect";
import RoomTypeInventoryManager from "@/components/RoomTypeInventoryManager"; // NEW
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProperties } from "@/hooks/useProperties";
import { Loader2, BedDouble, Info, Package } from "lucide-react";

interface RoomTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomType?: RoomType | null;
  onSubmit: (data: RoomTypeInput) => void;
  isLoading?: boolean;
  initialPropertyId?: string;
}

const RoomTypeDialog = ({ open, onOpenChange, roomType, onSubmit, isLoading, initialPropertyId }: RoomTypeDialogProps) => {
  const { properties } = useProperties();
  const form = useForm<RoomTypeInput>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      property_id: initialPropertyId || "",
      name: "",
      description: "",
      capacity: 1,
      base_price: 0,
      status: "active",
      amenities_json: [],
    },
  });

  useEffect(() => {
    if (roomType) {
      form.reset({
        property_id: roomType.property_id,
        name: roomType.name,
        description: roomType.description || "",
        capacity: roomType.capacity,
        base_price: roomType.base_price,
        status: roomType.status,
        amenities_json: roomType.amenities_json || [],
      });
    } else {
      form.reset({
        property_id: initialPropertyId || (properties.length > 0 ? properties[0].id : ""),
        name: "",
        description: "",
        capacity: 1,
        base_price: 0,
        status: "active",
        amenities_json: [],
      });
    }
  }, [roomType, open, form, properties, initialPropertyId]);

  const handleFormSubmit = (data: RoomTypeInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{roomType ? "Editar Tipo de Acomodação" : "Novo Tipo de Acomodação"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <Info className="h-4 w-4 mr-2" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="photos" disabled={!roomType}>
              <BedDouble className="h-4 w-4 mr-2" />
              Fotos
            </TabsTrigger>
            <TabsTrigger value="inventory" disabled={!roomType}>
              <Package className="h-4 w-4 mr-2" />
              Inventário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
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

                <div className="col-span-full">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Quarto Duplo, Chalé Luxo"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="col-span-full">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Uma breve descrição do tipo de acomodação e suas características."
                    rows={3}
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="capacity">Capacidade (Hóspedes) *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    {...form.register("capacity", { valueAsNumber: true })}
                  />
                  {form.formState.errors.capacity && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.capacity.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="base_price">Preço Base por Noite (R$) *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("base_price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.base_price && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.base_price.message}
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

                <div className="col-span-full border-t pt-4 mt-4">
                  <Label htmlFor="amenities_json">Comodidades</Label>
                  <Controller
                    name="amenities_json"
                    control={form.control}
                    render={({ field }) => (
                      <AmenityMultiSelect
                        value={field.value || []}
                        onChange={field.onChange}
                        disabled={isLoading}
                      />
                    )}
                  />
                  {form.formState.errors.amenities_json && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.amenities_json.message}
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
                  {roomType ? "Salvar Alterações" : "Criar Tipo de Acomodação"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            {roomType && <PhotoGallery entityId={roomType.id} editable />} {/* Changed prop name */}
            {!roomType && (
              <div className="text-center text-muted-foreground py-8">
                Crie o tipo de acomodação primeiro para adicionar fotos.
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory" className="mt-4 h-[60vh] overflow-y-auto">
            {roomType && <RoomTypeInventoryManager roomTypeId={roomType.id} />}
            {!roomType && (
              <div className="text-center text-muted-foreground py-8">
                Crie o tipo de acomodação primeiro para gerenciar o inventário.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RoomTypeDialog;