import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { useOrg } from '@/hooks/useOrg'; // Import useOrg

export const propertySchema = z.object({
  name: z.string().min(1, "O nome da propriedade é obrigatório."),
  description: z.string().optional().nullable(),
  address: z.string().min(1, "O endereço é obrigatório."),
  number: z.string().optional().nullable(),
  no_number: z.boolean().default(false),
  neighborhood: z.string().optional().nullable(),
  city: z.string().min(1, "A cidade é obrigatória."),
  state: z.string().min(1, "O estado é obrigatório."),
  country: z.string().optional().default('Brasil'),
  postal_code: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email("Email inválido.").optional().nullable().or(z.literal('')),
  total_rooms: z.number().min(0, "O número total de quartos não pode ser negativo."),
  status: z.enum(['active', 'inactive']).default('active'),
});

// Update Property Interface to include org_id
export interface Property {
  id: string;
  user_id: string;
  org_id?: string | null;
  name: string;
  description: string | null;
  address: string;
  number: string | null;
  no_number: boolean;
  neighborhood: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  total_rooms: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export type PropertyInput = z.infer<typeof propertySchema>;

export const useProperties = () => {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { currentOrgId, isLoading: isOrgLoading } = useOrg(); // Use Org Hook

  const { data: properties, isLoading: isPropertiesLoading, error } = useQuery({
    queryKey: ['properties', currentOrgId],
    queryFn: async () => {
      console.log('[useProperties] Fetching properties. currentOrgId:', currentOrgId);
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (currentOrgId) {
        query = query.eq('org_id', currentOrgId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useProperties] Error:', error);
        throw error;
      }
      console.log('[useProperties] Loaded properties count:', data?.length || 0);
      return data as Property[];
    },
    enabled: !authLoading && !isOrgLoading && !!user
  });

  const createProperty = useMutation({
    mutationFn: async (property: PropertyInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const payload: any = { ...property, user_id: user.id };

      // Attach org_id if available
      if (currentOrgId) {
        payload.org_id = currentOrgId;
      }

      const { data, error } = await supabase
        .from('properties')
        .insert([payload as TablesInsert<'properties'>])
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
    onError: (error: any) => {
      console.error('Error creating property:', error);

      // Check for custom trigger error code P0001 (Accommodation Limit)
      if (error?.code === 'P0001' || error?.message?.includes('Limite de acomodações atingido')) {
        toast({
          title: "Limite do Plano Atingido",
          description: "Você atingiu o número máximo de acomodações do seu plano. Faça um upgrade para adicionar mais.",
          variant: "destructive",
          // converting 'action' to simple text description if action prop not fully supported or complex
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao criar propriedade: " + error.message,
          variant: "destructive",
        });
      }
    },
  });

  const updateProperty = useMutation({
    mutationFn: async ({ id, property }: { id: string; property: Partial<PropertyInput> }) => {
      const { data, error } = await supabase
        .from('properties')
        .update(property as any)
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
    isLoading: isPropertiesLoading || isOrgLoading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};