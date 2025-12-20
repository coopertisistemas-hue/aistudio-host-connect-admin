import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

export const faqSchema = z.object({
  question: z.string().min(1, "A pergunta é obrigatória."),
  answer: z.string().min(1, "A resposta é obrigatória."),
  display_order: z.number().min(0).optional().default(0),
});

export type Faq = Tables<'faqs'>;
export type FaqInput = z.infer<typeof faqSchema>;

export const useFaqs = () => {
  const queryClient = useQueryClient();

  const { data: faqs, isLoading, error } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Faq[];
    },
  });

  const createFaq = useMutation({
    mutationFn: async (faq: FaqInput) => {
      const { data, error } = await supabase
        .from('faqs')
        .insert([faq as TablesInsert<'faqs'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({ title: "Sucesso!", description: "FAQ criada." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao criar FAQ: " + error.message, variant: "destructive" });
    },
  });

  const updateFaq = useMutation({
    mutationFn: async ({ id, faq }: { id: string; faq: Partial<FaqInput> }) => {
      const { data, error } = await supabase
        .from('faqs')
        .update(faq)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({ title: "Sucesso!", description: "FAQ atualizada." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao atualizar FAQ: " + error.message, variant: "destructive" });
    },
  });

  const deleteFaq = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      toast({ title: "Sucesso!", description: "FAQ removida." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao remover FAQ: " + error.message, variant: "destructive" });
    },
  });

  return {
    faqs: faqs || [],
    isLoading,
    error,
    createFaq,
    updateFaq,
    deleteFaq,
  };
};