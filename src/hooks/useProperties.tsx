import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert

export const propertySchema = z.object({
  name: z.string().min(1, "O nome da propriedade é obrigatório."),
  description: z.string().optional().nullable(),
  address: z.string().min(1, "O endereço é obrigatório."),
  city: z.string().min(1, "A cidade é obrigatória."),
  state: z.string().min(1, "O estado é obrigatório."),
  country: z.string().optional().default('Brasil'),
  postal_code: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Email inválido.").optional().nullable().or(z.literal('')),
  total_rooms: z.number().min(0, "O número total de quartos não pode ser negativo."),
  status: z.enum(['active', 'inactive']).default('active'),
});

export interface Property {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  total_rooms: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type PropertyInput = z.infer<typeof propertySchema>;

export const useProperties = () => {
  const queryClient = useQueryClient();

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Property[];
    },
  });

  const createProperty = useMutation({
    mutationFn: async (property: PropertyInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('properties')
        .insert([{ ...property, user_id: user.id } as TablesInsert<'properties'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: "Sucesso!",
        description: "Propriedade criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating property:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar propriedade: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateProperty = useMutation({
    mutationFn: async ({ id, property }: { id: string; property: Partial<PropertyInput> }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(property)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: "Sucesso!",
        description: "Propriedade atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating property:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar propriedade: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProperty = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast({
        title: "Sucesso!",
        description: "Propriedade removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting property:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover propriedade: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    properties: properties || [],
    isLoading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};