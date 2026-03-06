import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useOrg } from './useOrg';
import { useAuth } from './useAuth';

export const amenitySchema = z.object({
  property_id: z.string().uuid('A propriedade e obrigatoria.'),
  name: z.string().min(1, 'O nome da comodidade e obrigatorio.'),
  icon: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type Amenity = {
  id: string;
  org_id: string;
  property_id: string;
  name: string;
  icon: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type AmenityInput = z.infer<typeof amenitySchema>;

export const useAmenities = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrg();
  const { userRole } = useAuth();
  const isViewer = userRole === 'viewer';

  const { data: amenities, isLoading, error } = useQuery({
    queryKey: ['amenities', currentOrgId, propertyId],
    queryFn: async () => {
      if (!currentOrgId || !propertyId) return [];

      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .filter('org_id', 'eq', currentOrgId)
        .filter('property_id', 'eq', propertyId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Amenity[];
    },
    enabled: !!currentOrgId && !!propertyId,
  });

  const createAmenity = useMutation({
    mutationFn: async (amenity: AmenityInput) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId) throw new Error('ORG_CONTEXT_REQUIRED');
      if (!propertyId) throw new Error('PROPERTY_CONTEXT_REQUIRED');

      const payload = { ...amenity, org_id: currentOrgId, property_id: propertyId };
      const { data, error } = await supabase
        .from('amenities')
        .insert([payload as never])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities', currentOrgId, propertyId] });
      toast({ title: 'Sucesso!', description: 'Comodidade criada com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Erro ao criar comodidade: ' + error.message, variant: 'destructive' });
    },
  });

  const updateAmenity = useMutation({
    mutationFn: async ({ id, amenity }: { id: string; amenity: Partial<AmenityInput> }) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId || !propertyId) throw new Error('TENANT_CONTEXT_REQUIRED');

      const { data, error } = await supabase
        .from('amenities')
        .update(amenity)
        .eq('id', id)
        .filter('org_id', 'eq', currentOrgId)
        .filter('property_id', 'eq', propertyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities', currentOrgId, propertyId] });
      toast({ title: 'Sucesso!', description: 'Comodidade atualizada com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Erro ao atualizar comodidade: ' + error.message, variant: 'destructive' });
    },
  });

  const deleteAmenity = useMutation({
    mutationFn: async (id: string) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId || !propertyId) throw new Error('TENANT_CONTEXT_REQUIRED');

      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', id)
        .filter('org_id', 'eq', currentOrgId)
        .filter('property_id', 'eq', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities', currentOrgId, propertyId] });
      toast({ title: 'Sucesso!', description: 'Comodidade removida com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Erro ao remover comodidade: ' + error.message, variant: 'destructive' });
    },
  });

  return {
    amenities: amenities || [],
    isLoading,
    error,
    createAmenity,
    updateAmenity,
    deleteAmenity,
    isViewer,
  };
};

