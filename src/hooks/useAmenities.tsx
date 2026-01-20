import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { useOrg } from './useOrg';

export const amenitySchema = z.object({
  name: z.string().min(1, "O nome da comodidade é obrigatório."),
  icon: z.string().optional().nullable(), // Lucide icon name
  description: z.string().optional().nullable(),
});

export type Amenity = {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type AmenityInput = z.infer<typeof amenitySchema>;

export const useAmenities = () => {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrg();

  const { data: amenities, isLoading, error } = useQuery({
    queryKey: ['amenities', currentOrgId],
    queryFn: async () => {
      if (!currentOrgId) return [];
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .eq('org_id', currentOrgId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Amenity[];
    },
    enabled: !!currentOrgId,
  });

  const createAmenity = useMutation({
    mutationFn: async (amenity: AmenityInput) => {
      if (!currentOrgId) throw new Error("No Organization ID");
      const { data, error } = await supabase
        .from('amenities')
        .insert([{ ...amenity, org_id: currentOrgId } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities', currentOrgId] });
      toast({
        title: "Sucesso!",
        description: "Comodidade criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating amenity:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar comodidade: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateAmenity = useMutation({
    mutationFn: async ({ id, amenity }: { id: string; amenity: Partial<AmenityInput> }) => {
      const { data, error } = await supabase
        .from('amenities')
        .update(amenity)
        .eq('id', id)
        .eq('org_id', currentOrgId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities', currentOrgId] });
      toast({
        title: "Sucesso!",
        description: "Comodidade atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating amenity:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar comodidade: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAmenity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', id)
        .eq('org_id', currentOrgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amenities', currentOrgId] });
      toast({
        title: "Sucesso!",
        description: "Comodidade removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting amenity:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover comodidade: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    amenities: amenities || [],
    isLoading,
    error,
    createAmenity,
    updateAmenity,
    deleteAmenity,
  };
};