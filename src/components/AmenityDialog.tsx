import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Amenity, AmenityInput, amenitySchema } from "@/hooks/useAmenities";
import { Loader2, Wifi, Info } from "lucide-react"; // Example icons
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as LucideIcons from "lucide-react";

const normalizeIconName = (name: string): string => {
  if (!name) return "";
  return name
    .split(/[-_\s]+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
};

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
          <DialogDescription className="sr-only">
            {amenity ? "Edite os detalhes da comodidade." : "Cadastre uma nova comodidade para suas propriedades."}
          </DialogDescription>
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
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="icon"
                  placeholder="Ex: BedDouble, Refrigerator, Tv"
                  {...form.register("icon")}
                />
              </div>
              <div className="h-10 w-10 border rounded flex items-center justify-center bg-muted/30">
                {(() => {
                  const name = normalizeIconName(form.watch("icon") || "");
                  const Icon = (LucideIcons as any)[name];
                  return Icon ? <Icon className="h-5 w-5" /> : <LucideIcons.HelpCircle className="h-5 w-5 text-muted-foreground" />;
                })()}
              </div>
            </div>
            {form.formState.errors.icon && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.icon.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Tente `BedDouble`, `Refrigerator`, `Tv`, `Wifi`. Aceitamos minúsculas e hífens!
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