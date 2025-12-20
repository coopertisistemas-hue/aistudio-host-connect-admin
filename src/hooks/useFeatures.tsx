import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

export const featureSchema = z.object({
  title: z.string().min(1, "O título da funcionalidade é obrigatório."),
  description: z.string().min(1, "A descrição é obrigatória."),
  icon: z.string().optional().nullable(), // Lucide icon name
  display_order: z.number().min(0).optional().default(0),
});

export type Feature = TablesInsert<'features'> & { id: string; created_at: string; updated_at: string; }; // Extend with id and timestamps
export type FeatureInput = z.infer<typeof featureSchema>;

export const useFeatures = () => {
  const queryClient = useQueryClient();

  const { data: features, isLoading, error } = useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Feature[];
    },
  });

  const createFeature = useMutation({
    mutationFn: async (feature: FeatureInput) => {
      const { data, error } = await supabase
        .from('features')
        .insert([feature as TablesInsert<'features'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast({ title: "Sucesso!", description: "Funcionalidade criada." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao criar funcionalidade: " + error.message, variant: "destructive" });
    },
  });

  const updateFeature = useMutation({
    mutationFn: async ({ id, feature }: { id: string; feature: Partial<FeatureInput> }) => {
      const { data, error } = await supabase
        .from('features')
        .update(feature)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast({ title: "Sucesso!", description: "Funcionalidade atualizada." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao atualizar funcionalidade: " + error.message, variant: "destructive" });
    },
  });

  const deleteFeature = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast({ title: "Sucesso!", description: "Funcionalidade removida." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao remover funcionalidade: " + error.message, variant: "destructive" });
    },
  });

  return {
    features: features || [],
    isLoading,
    error,
    createFeature,
    updateFeature,
    deleteFeature,
  };
};