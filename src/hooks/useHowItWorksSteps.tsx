import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

export const howItWorksStepSchema = z.object({
  step_number: z.number().min(1, "O número do passo é obrigatório."),
  title: z.string().min(1, "O título é obrigatório."),
  description: z.string().min(1, "A descrição é obrigatória."),
  icon: z.string().optional().nullable(), // Lucide icon name
});

export type HowItWorksStep = Tables<'how_it_works_steps'>;
export type HowItWorksStepInput = z.infer<typeof howItWorksStepSchema>;

export const useHowItWorksSteps = () => {
  const queryClient = useQueryClient();

  const { data: steps, isLoading, error } = useQuery({
    queryKey: ['how_it_works_steps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('how_it_works_steps')
        .select('*')
        .order('step_number', { ascending: true });

      if (error) throw error;
      return data as HowItWorksStep[];
    },
  });

  const createStep = useMutation({
    mutationFn: async (step: HowItWorksStepInput) => {
      const { data, error } = await supabase
        .from('how_it_works_steps')
        .insert([step as TablesInsert<'how_it_works_steps'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['how_it_works_steps'] });
      toast({ title: "Sucesso!", description: "Passo criado." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao criar passo: " + error.message, variant: "destructive" });
    },
  });

  const updateStep = useMutation({
    mutationFn: async ({ id, step }: { id: string; step: Partial<HowItWorksStepInput> }) => {
      const { data, error } = await supabase
        .from('how_it_works_steps')
        .update(step)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['how_it_works_steps'] });
      toast({ title: "Sucesso!", description: "Passo atualizado." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao atualizar passo: " + error.message, variant: "destructive" });
    },
  });

  const deleteStep = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('how_it_works_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['how_it_works_steps'] });
      toast({ title: "Sucesso!", description: "Passo removido." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao remover passo: " + error.message, variant: "destructive" });
    },
  });

  return {
    steps: steps || [],
    isLoading,
    error,
    createStep,
    updateStep,
    deleteStep,
  };
};