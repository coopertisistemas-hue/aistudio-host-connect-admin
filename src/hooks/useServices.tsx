import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useOrg } from './useOrg';
import { useAuth } from './useAuth';

export const serviceSchema = z.object({
  property_id: z.string().min(1, 'A propriedade e obrigatoria.'),
  name: z.string().min(1, 'O nome do servico e obrigatorio.'),
  description: z.string().optional().nullable(),
  price: z.number().min(0, 'O preco nao pode ser negativo.'),
  is_per_person: z.boolean().default(false),
  is_per_day: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type Service = {
  id: string;
  org_id: string;
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
  const { currentOrgId } = useOrg();
  const { userRole } = useAuth();
  const isViewer = userRole === 'viewer';

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services', currentOrgId, propertyId],
    queryFn: async () => {
      if (!propertyId || !currentOrgId) return [];

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('property_id', propertyId)
        .filter('org_id', 'eq', currentOrgId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!propertyId && !!currentOrgId,
  });

  const createService = useMutation({
    mutationFn: async (service: ServiceInput) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId) throw new Error('ORG_CONTEXT_REQUIRED');
      if (!propertyId) throw new Error('PROPERTY_CONTEXT_REQUIRED');

      const payload = { ...service, org_id: currentOrgId, property_id: propertyId };
      const { data, error } = await supabase
        .from('services')
        .insert([payload as never])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', currentOrgId, propertyId] });
      toast({ title: 'Sucesso!', description: 'Servico criado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Erro ao criar servico: ' + error.message, variant: 'destructive' });
    },
  });

  const updateService = useMutation({
    mutationFn: async ({ id, service }: { id: string; service: Partial<ServiceInput> }) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId || !propertyId) throw new Error('TENANT_CONTEXT_REQUIRED');

      const { data, error } = await supabase
        .from('services')
        .update(service)
        .eq('id', id)
        .eq('org_id', currentOrgId)
        .eq('property_id', propertyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', currentOrgId, propertyId] });
      toast({ title: 'Sucesso!', description: 'Servico atualizado com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Erro ao atualizar servico: ' + error.message, variant: 'destructive' });
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId || !propertyId) throw new Error('TENANT_CONTEXT_REQUIRED');

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('org_id', currentOrgId)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services', currentOrgId, propertyId] });
      toast({ title: 'Sucesso!', description: 'Servico removido com sucesso.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: 'Erro ao remover servico: ' + error.message, variant: 'destructive' });
    },
  });

  return {
    services: services || [],
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
    isViewer,
  };
};

