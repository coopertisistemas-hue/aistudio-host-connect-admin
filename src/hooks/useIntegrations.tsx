import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

export const integrationSchema = z.object({
  name: z.string().min(1, "O nome da integração é obrigatório."),
  icon: z.string().optional().nullable(), // Lucide icon name
  description: z.string().optional().nullable(),
  is_visible: z.boolean().optional().default(true),
  display_order: z.number().min(0).optional().default(0),
});

export type Integration = Tables<'integrations'>;
export type IntegrationInput = z.infer<typeof integrationSchema>;

export const useIntegrations = () => {
  const queryClient = useQueryClient();

  const { data: integrations, isLoading, error } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Integration[];
    },
  });

  const createIntegration = useMutation({
    mutationFn: async (integration: IntegrationInput) => {
      const { data, error } = await supabase
        .from('integrations')
        .insert([integration as TablesInsert<'integrations'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({ title: "Sucesso!", description: "Integração criada." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao criar integração: " + error.message, variant: "destructive" });
    },
  });

  const updateIntegration = useMutation({
    mutationFn: async ({ id, integration }: { id: string; integration: Partial<IntegrationInput> }) => {
      const { data, error } = await supabase
        .from('integrations')
        .update(integration)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({ title: "Sucesso!", description: "Integração atualizada." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao atualizar integração: " + error.message, variant: "destructive" });
    },
  });

  const deleteIntegration = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast({ title: "Sucesso!", description: "Integração removida." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao remover integração: " + error.message, variant: "destructive" });
    },
  });

  return {
    integrations: integrations || [],
    isLoading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
  };
};