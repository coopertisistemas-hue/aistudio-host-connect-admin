import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Amenity, AmenityInput, amenitySchema } from "@/hooks/useAmenities";
import { Loader2, Wifi, Info } from "lucide-react"; // Example icons
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface AmenityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenity?: Amenity | null;
  onSubmit: (data: AmenityInput) => void;
  isLoading?: boolean;
}

const AmenityDialog = ({ open, onOpenChange, amenity, onSubmit, isLoading }: AmenityDialogProps) => {
  const form = useForm<AmenityInput>({
    resolver: zodResolver(amenitySchema),
    defaultValues: {
      name: "",
      icon: "",
      description: "",
    },
  });

  useEffect(() => {
    if (amenity) {
      form.reset({
        name: amenity.name,
        icon: amenity.icon || "",
        description: amenity.description || "",
      });
    } else {
      form.reset({
        name: "",
        icon: "",
        description: "",
      });
    }
  }, [amenity, open, form]);

  const handleFormSubmit = (data: AmenityInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{amenity ? "Editar Comodidade" : "Nova Comodidade"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Comodidade *</Label>
            <Input
              id="name"
              placeholder="Ex: Wi-Fi Grátis, Piscina, Café da Manhã"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ícone (Nome do Lucide Icon)</Label>
            <Input
              id="icon"
              placeholder="Ex: Wifi, Coffee, SwimmingPool"
              {...form.register("icon")}
            />
            {form.formState.errors.icon && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.icon.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Use nomes de ícones da biblioteca Lucide React (ex: `Wifi`, `Coffee`).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Uma breve descrição da comodidade."
              rows={3}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {amenity ? "Salvar Alterações" : "Criar Comodidade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AmenityDialog;