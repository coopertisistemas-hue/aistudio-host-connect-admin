import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

export const testimonialSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  role: z.string().optional().nullable(),
  content: z.string().min(1, "O conteúdo do depoimento é obrigatório."),
  location: z.string().optional().nullable(),
  rating: z.number().min(1).max(5, "A avaliação deve ser entre 1 e 5.").optional().nullable(),
  is_visible: z.boolean().optional().default(true),
  display_order: z.number().min(0).optional().default(0),
});

export type Testimonial = Tables<'testimonials'>;
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const useTestimonials = () => {
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading, error } = useQuery({
    queryKey: ['testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const createTestimonial = useMutation({
    mutationFn: async (testimonial: TestimonialInput) => {
      const { data, error } = await supabase
        .from('testimonials')
        .insert([testimonial as TablesInsert<'testimonials'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast({ title: "Sucesso!", description: "Depoimento criado." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao criar depoimento: " + error.message, variant: "destructive" });
    },
  });

  const updateTestimonial = useMutation({
    mutationFn: async ({ id, testimonial }: { id: string; testimonial: Partial<TestimonialInput> }) => {
      const { data, error } = await supabase
        .from('testimonials')
        .update(testimonial)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast({ title: "Sucesso!", description: "Depoimento atualizado." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao atualizar depoimento: " + error.message, variant: "destructive" });
    },
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast({ title: "Sucesso!", description: "Depoimento removido." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: "Erro ao remover depoimento: " + error.message, variant: "destructive" });
    },
  });

  return {
    testimonials: testimonials || [],
    isLoading,
    error,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial,
  };
};