import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

export const pricingPlanSchema = z.object({
  name: z.string().min(1, "O nome do plano é obrigatório."),
  price: z.number().min(0, "O preço deve ser positivo."),
  commission: z.number().min(0).max(100, "A comissão deve ser entre 0 e 100."),
  period: z.string().min(1, "O período é obrigatório (ex: /mês)."),
  description: z.string().optional().nullable(),
  is_popular: z.boolean().optional().default(false),
  display_order: z.number().min(0).optional().default(0),
  features: z.array(z.string()).optional().nullable(),
});

export type PricingPlan = Tables<'pricing_plans'> & {
  features: string[]; // Assuming features are stored as JSONB array of strings
};

export type PricingPlanInput = z.infer<typeof pricingPlanSchema>;

export const usePricingPlans = () => {
  const queryClient = useQueryClient();

  const { data: plans, isLoading, error } = useQuery({
    queryKey: ['pricing_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      // Map features from JSONB to string array
      return data.map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
      })) as PricingPlan[];
    },
  });

  const createPlan = useMutation({
    mutationFn: async (plan: PricingPlanInput) => {
      const { data, error } = await supabase
        .from('pricing_plans')
        .insert([{ ...plan, features: plan.features || [] } as TablesInsert<'pricing_plans'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing_plans'] });
      toast({ title: "Sucesso!", description: "Plano de preço criado." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao criar plano: " + error.message, variant: "destructive" });
    },
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, plan }: { id: string; plan: Partial<PricingPlanInput> }) => {
      const updateData: any = { ...plan };
      if (plan.features) {
        updateData.features = plan.features;
      }

      const { data, error } = await supabase
        .from('pricing_plans')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing_plans'] });
      toast({ title: "Sucesso!", description: "Plano de preço atualizado." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao atualizar plano: " + error.message, variant: "destructive" });
    },
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing_plans'] });
      toast({ title: "Sucesso!", description: "Plano de preço removido." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao remover plano: " + error.message, variant: "destructive" });
    },
  });

  return {
    plans: plans || [],
    isLoading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
  };
};