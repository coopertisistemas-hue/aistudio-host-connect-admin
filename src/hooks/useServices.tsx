import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert

export const serviceSchema = z.object({
  property_id: z.string().min(1, "A propriedade é obrigatória."),
  name: z.string().min(1, "O nome do serviço é obrigatório."),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "O preço não pode ser negativo."),
  is_per_person: z.boolean().default(false),
  is_per_day: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type Service = {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  price: number;
  is_per_person: boolean;
  is_per_day: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
};

export type ServiceInput = z.infer<typeof serviceSchema>;

export const useServices = (propertyId?: string) => {
  const queryClient = useQueryClient();

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('property_id', propertyId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!propertyId, // Only run query if propertyId is provided
  });

  const createService = useMutation({
    mutationFn: async (service: ServiceInput) => {
      const { data, error } = await supabase
        .from('services')
        .insert([service as TablesInsert<'services'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Serviço criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating service:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar serviço: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, service }: { id: string; service: Partial<ServiceInput> }) => {
      const { data, error } = await supabase
        .from('services')
        .update(service)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Serviço atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating service:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar serviço: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Serviço removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting service:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover serviço: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    services: services || [],
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
  };
};