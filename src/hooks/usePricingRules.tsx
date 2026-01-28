import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TablesInsert } from '@/integrations/supabase/types';
import { useOrg } from '@/hooks/useOrg';

export const pricingRuleSchema = z.object({
  property_id: z.string().min(1, "A propriedade é obrigatória."),
  room_type_id: z.string().optional().nullable(),
  start_date: z.date({ required_error: "A data de início é obrigatória." }),
  end_date: z.date({ required_error: "A data de término é obrigatória." }),
  base_price_override: z.number().min(0, "O preço base não pode ser negativo.").optional().nullable(),
  price_modifier: z.number().min(0, "O modificador de preço não pode ser negativo.").optional().nullable(),
  min_stay: z.number().min(1, "A estadia mínima deve ser no mínimo 1.").optional().nullable(),
  max_stay: z.number().min(1, "A estadia máxima deve ser no mínimo 1.").optional().nullable(),
  promotion_name: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive']).default('active'),
}).refine((data) => data.end_date >= data.start_date, {
  message: "A data de término deve ser posterior ou igual à data de início.",
  path: ["end_date"],
}).refine((data) => data.base_price_override !== null || data.price_modifier !== null, {
  message: "Pelo menos um 'Preço Base' ou 'Modificador de Preço' deve ser fornecido.",
  path: ["base_price_override"],
});

export type PricingRule = {
  id: string;
  property_id: string;
  room_type_id: string | null;
  start_date: string;
  end_date: string;
  base_price_override: number | null;
  price_modifier: number | null;
  min_stay: number | null;
  max_stay: number | null;
  promotion_name: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  properties?: {
    name: string;
    city: string;
  };
  room_types?: {
    name: string;
  };
};

export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;

export const usePricingRules = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrg();

  const { data: pricingRules, isLoading, error } = useQuery({
    queryKey: ['pricing_rules', currentOrgId, propertyId],
    queryFn: async () => {
      if (!propertyId || !currentOrgId) return [];
      const { data, error } = await (supabase as any)
        .from('pricing_rules')
        .select(`
          *,
          properties (
            name,
            city
          ),
          room_types (
            name
          )
        `)
        .eq('property_id', propertyId)
        .eq('org_id', currentOrgId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as PricingRule[];
    },
    enabled: !!propertyId && !!currentOrgId,
  });

  const createPricingRule = useMutation({
    mutationFn: async (rule: PricingRuleInput) => {
      if (!currentOrgId) throw new Error("No Organization ID");
      const { data, error } = await supabase
        .from('pricing_rules')
        .insert([{
          ...rule,
          org_id: currentOrgId,
          start_date: rule.start_date.toISOString().split('T')[0],
          end_date: rule.end_date.toISOString().split('T')[0],
        } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing_rules', currentOrgId, propertyId] });
      toast({
        title: "Sucesso!",
        description: "Regra de precificação criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating pricing rule:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar regra de precificação: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updatePricingRule = useMutation({
    mutationFn: async ({ id, rule }: { id: string; rule: Partial<PricingRuleInput> }) => {
      const updateData: any = { ...rule };

      if (rule.start_date) {
        updateData.start_date = rule.start_date.toISOString().split('T')[0];
      }
      if (rule.end_date) {
        updateData.end_date = rule.end_date.toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('pricing_rules')
        .update(updateData)
        .eq('id', id)
        .eq('org_id', currentOrgId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing_rules', currentOrgId, propertyId] });
      toast({
        title: "Sucesso!",
        description: "Regra de precificação atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating pricing rule:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar regra de precificação: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deletePricingRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pricing_rules')
        .delete()
        .eq('id', id)
        .eq('org_id', currentOrgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing_rules', currentOrgId, propertyId] });
      toast({
        title: "Sucesso!",
        description: "Regra de precificação removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting pricing rule:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover regra de precificação: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    pricingRules: pricingRules || [],
    isLoading,
    error,
    createPricingRule,
    updatePricingRule,
    deletePricingRule,
  };
};
