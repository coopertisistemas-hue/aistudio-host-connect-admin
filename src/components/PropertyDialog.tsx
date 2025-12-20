import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Property, PropertyInput, propertySchema } from "@/hooks/useProperties";
import PhotoGallery from "@/components/PhotoGallery";
import { Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface PropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
  onSubmit: (data: PropertyInput) => void;
  isLoading?: boolean;
}

const PropertyDialog = ({ open, onOpenChange, property, onSubmit, isLoading }: PropertyDialogProps) => {
  const form = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      country: "Brasil",
      postal_code: "",
      phone: "",
      email: "",
      total_rooms: 1,
      status: "active",
    },
  });

  useEffect(() => {
    if (property) {
      form.reset({
        name: property.name,
        description: property.description || "",
        address: property.address,
        city: property.city,
        state: property.state,
        country: property.country,
        postal_code: property.postal_code || "",
        phone: property.phone || "",
        email: property.email || "",
        total_rooms: property.total_rooms,
        status: property.status,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        address: "",
        city: "",
        state: "",
        country: "Brasil",
        postal_code: "",
        phone: "",
        email: "",
        total_rooms: 1,
        status: "active",
      });
    }
  }, [property, open, form]);

  const handleFormSubmit = (data: PropertyInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{property ? "Editar Propriedade" : "Nova Propriedade"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="photos" disabled={!property}>Fotos</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Nome da Propriedade"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Uma breve descrição da propriedade"
                    rows={3}
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Endereço *</Label>
                  <Input
                    id="address"
                    placeholder="Rua Exemplo, 123"
                    {...form.register("address")}
                  />
                  {form.formState.errors.address && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    placeholder="Urubici"
                    {...form.register("city")}
                  />
                  {form.formState.errors.city && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.city.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    placeholder="SC"
                    {...form.register("state")}
                  />
                  {form.formState.errors.state && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.state.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    placeholder="Brasil"
                    {...form.register("country")}
                  />
                  {form.formState.errors.country && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.country.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="postal_code">CEP</Label>
                  <Input
                    id="postal_code"
                    placeholder="88650-000"
                    {...form.register("postal_code")}
                  />
                  {form.formState.errors.postal_code && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.postal_code.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(49) 99999-9999"
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contato@propriedade.com"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="total_rooms">Total de Quartos *</Label>
                  <Input
                    id="total_rooms"
                    type="number"
                    min="0"
                    {...form.register("total_rooms", { valueAsNumber: true })}
                  />
                  {form.formState.errors.total_rooms && (
                    <p className="text-destructive text-sm mt-1">
                      {form.formState.errors.total_rooms.message}
                    </p>
                  )}
                </div>

                <div>
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

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {property ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            {property && <PhotoGallery entityId={property.id} editable />} {/* Changed prop name */}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDialog;