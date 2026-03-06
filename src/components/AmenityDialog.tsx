import { ComponentType, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Amenity, AmenityInput, amenitySchema } from '@/hooks/useAmenities';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as LucideIcons from 'lucide-react';

const normalizeIconName = (name: string): string => {
  if (!name) return '';
  return name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
};

interface AmenityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenity?: Amenity | null;
  onSubmit: (data: AmenityInput) => void;
  isLoading?: boolean;
  initialPropertyId?: string;
}

const AmenityDialog = ({ open, onOpenChange, amenity, onSubmit, isLoading, initialPropertyId }: AmenityDialogProps) => {
  const iconMap = LucideIcons as Record<string, ComponentType<{ className?: string }>>;
  const form = useForm<AmenityInput>({
    resolver: zodResolver(amenitySchema),
    defaultValues: {
      property_id: initialPropertyId || '',
      name: '',
      icon: '',
      description: '',
    },
  });

  useEffect(() => {
    if (amenity) {
      form.reset({
        property_id: amenity.property_id,
        name: amenity.name,
        icon: amenity.icon || '',
        description: amenity.description || '',
      });
      return;
    }

    form.reset({
      property_id: initialPropertyId || '',
      name: '',
      icon: '',
      description: '',
    });
  }, [amenity, open, form, initialPropertyId]);

  const handleFormSubmit = (data: AmenityInput) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{amenity ? 'Editar Comodidade' : 'Nova Comodidade'}</DialogTitle>
          <DialogDescription className="sr-only">
            {amenity ? 'Edite os detalhes da comodidade.' : 'Cadastre uma nova comodidade para sua propriedade.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <input type="hidden" {...form.register('property_id')} />

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Comodidade *</Label>
            <Input id="name" placeholder="Ex: Wi-Fi Gratis, Piscina, Cafe da Manha" {...form.register('name')} />
            {form.formState.errors.name && <p className="text-destructive text-sm mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icone (nome Lucide)</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input id="icon" placeholder="Ex: BedDouble, Refrigerator, Tv" {...form.register('icon')} />
              </div>
              <div className="h-10 w-10 border rounded flex items-center justify-center bg-muted/30">
                {(() => {
                  const name = normalizeIconName(form.watch('icon') || '');
                  const Icon = iconMap[name];
                  return Icon ? <Icon className="h-5 w-5" /> : <LucideIcons.HelpCircle className="h-5 w-5 text-muted-foreground" />;
                })()}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descricao</Label>
            <Textarea id="description" placeholder="Breve descricao da comodidade." rows={3} {...form.register('description')} />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || !initialPropertyId}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {amenity ? 'Salvar Alteracoes' : 'Criar Comodidade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AmenityDialog;


