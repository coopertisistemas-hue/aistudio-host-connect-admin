import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Testimonial, TestimonialInput, testimonialSchema } from "@/hooks/useTestimonials";
import { Loader2, Star, User } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TestimonialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testimonial?: Testimonial | null;
  onSubmit: (data: TestimonialInput) => void;
  isLoading?: boolean;
}

const TestimonialDialog = ({ open, onOpenChange, testimonial, onSubmit, isLoading }: TestimonialDialogProps) => {
  const form = useForm<TestimonialInput>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      role: "",
      content: "",
      location: "",
      rating: 5,
      is_visible: true,
      display_order: 0,
    },
  });

  useEffect(() => {
    if (testimonial) {
      form.reset({
        name: testimonial.name,
        role: testimonial.role || "",
        content: testimonial.content,
        location: testimonial.location || "",
        rating: testimonial.rating || 5,
        is_visible: testimonial.is_visible || true,
        display_order: testimonial.display_order || 0,
      });
    } else {
      form.reset({
        name: "",
        role: "",
        content: "",
        location: "",
        rating: 5,
        is_visible: true,
        display_order: 0,
      });
    }
  }, [testimonial, open, form]);

  const handleFormSubmit = (data: TestimonialInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{testimonial ? "Editar Depoimento" : "Novo Depoimento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente *</Label>
            <Input
              id="name"
              placeholder="Ex: João Silva"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Cargo/Função (Opcional)</Label>
            <Input
              id="role"
              placeholder="Ex: Gerente de Hotel, Hóspede Frequente"
              {...form.register("role")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo do Depoimento *</Label>
            <Textarea
              id="content"
              placeholder="O que o cliente disse sobre sua experiência..."
              rows={5}
              {...form.register("content")}
            />
            {form.formState.errors.content && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Localização (Opcional)</Label>
            <Input
              id="location"
              placeholder="Ex: São Paulo, Brasil"
              {...form.register("location")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rating">Avaliação (1-5 Estrelas)</Label>
            <Controller
              name="rating"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() || "5"}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a avaliação" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Estrela{num > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.rating && (
              <p className="text-destructive text-sm mt-1">
                {form.formState.errors.rating.message}
              </p>
            )}
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
              {testimonial ? "Salvar Alterações" : "Criar Depoimento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestimonialDialog;