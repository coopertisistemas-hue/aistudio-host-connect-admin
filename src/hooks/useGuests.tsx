import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useOrg } from './useOrg';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Guest = Tables<'guests'>;
export type GuestInsert = TablesInsert<'guests'>;
export type GuestUpdate = TablesUpdate<'guests'>;

export const useGuests = (searchTerm?: string) => {
  const queryClient = useQueryClient();
  const { currentOrgId, isLoading: isOrgLoading } = useOrg();

  const { data: guests, isLoading, error } = useQuery({
    queryKey: ['guests', currentOrgId, searchTerm],
    queryFn: async () => {
      if (!currentOrgId) throw new Error('Organization context required');

      let query = supabase
        .from('guests')
        .select('*')
        .eq('org_id', currentOrgId)
        .order('created_at', { ascending: false });

      if (searchTerm && searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},document.ilike.${term}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Guest[];
    },
    enabled: !!currentOrgId && !isOrgLoading,
  });

  const createGuest = useMutation({
    mutationFn: async (guest: GuestInsert) => {
      if (!currentOrgId) throw new Error('Organization context required');

      const { data, error } = await supabase
        .from('guests')
        .insert({ ...guest, org_id: currentOrgId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', currentOrgId] });
      toast({
        title: 'Sucesso',
        description: 'Hóspede cadastrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao cadastrar hóspede.',
        variant: 'destructive',
      });
    },
  });

  const updateGuest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: GuestUpdate }) => {
      if (!currentOrgId) throw new Error('Organization context required');

      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', id)
        .eq('org_id', currentOrgId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', currentOrgId] });
      toast({
        title: 'Sucesso',
        description: 'Hóspede atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar hóspede.',
        variant: 'destructive',
      });
    },
  });

  const deleteGuest = useMutation({
    mutationFn: async (id: string) => {
      if (!currentOrgId) throw new Error('Organization context required');

      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id)
        .eq('org_id', currentOrgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests', currentOrgId] });
      toast({
        title: 'Sucesso',
        description: 'Hóspede removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover hóspede.',
        variant: 'destructive',
      });
    },
  });

  return {
    guests: guests || [],
    isLoading: isLoading || isOrgLoading,
    error,
    createGuest,
    updateGuest,
    deleteGuest,
  };
};

export const useGuest = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const { currentOrgId, isLoading: isOrgLoading } = useOrg();

  const { data: guest, isLoading, error } = useQuery({
    queryKey: ['guest', currentOrgId, id],
    queryFn: async () => {
      if (!currentOrgId) throw new Error('Organization context required');
      if (!id) throw new Error('Guest ID required');

      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('id', id)
        .eq('org_id', currentOrgId)
        .single();

      if (error) throw error;
      return data as Guest;
    },
    enabled: !!currentOrgId && !!id && !isOrgLoading,
  });

  const updateGuest = useMutation({
    mutationFn: async (updates: GuestUpdate) => {
      if (!currentOrgId) throw new Error('Organization context required');
      if (!id) throw new Error('Guest ID required');

      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', id)
        .eq('org_id', currentOrgId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest', currentOrgId, id] });
      queryClient.invalidateQueries({ queryKey: ['guests', currentOrgId] });
      toast({
        title: 'Sucesso',
        description: 'Hóspede atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar hóspede.',
        variant: 'destructive',
      });
    },
  });

  return {
    guest,
    isLoading: isLoading || isOrgLoading,
    error,
    updateGuest,
  };
};
