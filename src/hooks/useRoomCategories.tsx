import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useOrg } from './useOrg';
import { useAuth } from './useAuth';

export const roomCategorySchema = z.object({
  property_id: z.string().uuid('A propriedade e obrigatoria.'),
  name: z.string().min(1, 'O nome da categoria e obrigatorio.'),
  slug: z.string().min(1, 'O slug e obrigatorio.').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, numeros e hifens.'),
  description: z.string().optional().nullable(),
  display_order: z.number().min(0).default(0),
});

export type RoomCategory = {
  id: string;
  org_id: string;
  property_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type RoomCategoryInput = z.infer<typeof roomCategorySchema>;

export const useRoomCategories = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrg();
  const { userRole } = useAuth();
  const isViewer = userRole === 'viewer';

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['room_categories', currentOrgId, propertyId],
    queryFn: async () => {
      if (!currentOrgId || !propertyId) return [];

      const { data, error } = await supabase
        .from('room_categories')
        .select('*')
        .eq('org_id', currentOrgId)
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as RoomCategory[];
    },
    enabled: !!currentOrgId && !!propertyId,
  });

  const createCategory = useMutation({
    mutationFn: async (category: RoomCategoryInput) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId) throw new Error('ORG_CONTEXT_REQUIRED');

      const { data, error } = await supabase
        .from('room_categories')
        .insert([{ ...category, org_id: currentOrgId } as never])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room_categories', currentOrgId, propertyId] });
      toast({
        title: 'Sucesso!',
        description: 'Categoria criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      const message = error.message === 'VIEWER_BLOCKED'
        ? 'Usuarios visualizadores nao podem criar categorias.'
        : error.message;

      toast({
        title: 'Erro',
        description: 'Erro ao criar categoria: ' + message,
        variant: 'destructive',
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: Partial<RoomCategoryInput> }) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId || !propertyId) throw new Error('TENANT_CONTEXT_REQUIRED');

      const { data, error } = await supabase
        .from('room_categories')
        .update(category)
        .eq('id', id)
        .eq('org_id', currentOrgId)
        .eq('property_id', propertyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room_categories', currentOrgId, propertyId] });
      toast({
        title: 'Sucesso!',
        description: 'Categoria atualizada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar categoria: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      if (isViewer) throw new Error('VIEWER_BLOCKED');
      if (!currentOrgId || !propertyId) throw new Error('TENANT_CONTEXT_REQUIRED');

      const { error } = await supabase
        .from('room_categories')
        .delete()
        .eq('id', id)
        .eq('org_id', currentOrgId)
        .eq('property_id', propertyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room_categories', currentOrgId, propertyId] });
      toast({
        title: 'Sucesso!',
        description: 'Categoria removida com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: 'Erro ao remover categoria: ' + error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    categories: categories || [],
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    isViewer,
  };
};

