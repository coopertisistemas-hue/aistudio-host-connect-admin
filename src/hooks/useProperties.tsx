import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { useOrg } from '@/hooks/useOrg'; // Import useOrg
import { safeLogger } from '@/lib/logging/safeLogger';

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
      // Se não houver Org definida, não adianta buscar propriedades (evita erro de RLS ou retorno vazio demorado)
      if (!currentOrgId) {
        return [];
      }

      safeLogger.info('[useProperties] fetch_start', { orgId: currentOrgId });

      // Timeout externo: Promise.race
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PROPERTIES_TIMEOUT')), 8000);
      });

      const queryPromise = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('org_id', currentOrgId);

      let data: any = null;
      let error: any = null;

      try {
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        data = result.data;
        error = result.error;
      } catch (timeoutError: any) {
        if (timeoutError.message === 'PROPERTIES_TIMEOUT') {
          safeLogger.warn('[useProperties] timeout_fallback', { waitedMs: 8000 });
          return []; // Retorna array vazio para permitir acesso
        }
        throw timeoutError;
      }

      if (error) {
        safeLogger.error('[useProperties] fetch_error', { message: error.message });
        // Retorna array vazio em vez de throw para não bloquear
        return [];
      }
      safeLogger.info('[useProperties] fetch_success', { count: data?.length || 0 });
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
      safeLogger.error('[useProperties] create_error', { message: error.message });

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
      safeLogger.error('[useProperties] update_error', { message: error.message });
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
      safeLogger.error('[useProperties] delete_error', { message: error.message });
      toast({
        title: "Erro",
        description: "Erro ao remover propriedade: " + error.message,
        variant: "destructive",
      });
    },
  });

  const finalLoading = isPropertiesLoading || isOrgLoading || authLoading;

  return {
    properties: properties || [],
    isLoading: finalLoading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};