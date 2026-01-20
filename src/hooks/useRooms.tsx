import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert

import { useOrg } from './useOrg'; // Multi-tenant context

// Definindo o tipo de retorno da query de rooms com joins
type RoomRow = Tables<'rooms'>;
type RoomTypeRow = Tables<'room_types'>;

export type Room = RoomRow & {
  room_types?: Pick<RoomTypeRow, 'name'> | null;
};

export const roomSchema = z.object({
  property_id: z.string().min(1, "A propriedade é obrigatória."),
  room_type_id: z.string().min(1, "O tipo de acomodação é obrigatório."),
  room_number: z.string().min(1, "O número do quarto é obrigatório."),
  status: z.enum(['available', 'occupied', 'maintenance']).default('available'),
  last_booking_id: z.string().optional().nullable(), // Adicionado last_booking_id ao schema
});

export type RoomInput = z.infer<typeof roomSchema>;

export const useRooms = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const { currentOrgId, isLoading: isOrgLoading } = useOrg();

  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ['rooms', currentOrgId, propertyId],
    queryFn: async () => {
      console.log('[useRooms] Fetching rooms...', { currentOrgId, propertyId });
      if (!currentOrgId) {
        console.warn('[useRooms] Abortando fetch: currentOrgId indefinido.');
        return [];
      }
      if (!propertyId) {
        console.warn('[useRooms] No propertyId provided');
        return [];
      }
      const { data, error } = await (supabase as any)
        .from('rooms')
        .select(`
          *,
          room_types (
            name
          )
        `)
        .eq('org_id', currentOrgId) // 🔐 ALWAYS filter by org_id
        .eq('property_id', propertyId)
        .order('room_number', { ascending: true });

      if (error) {
        console.error('[useRooms] Error fetching rooms:', error);
        throw error;
      }
      console.log(`[useRooms] Successfully fetched ${data?.length || 0} rooms`);
      return data as Room[];
    },
    enabled: !isOrgLoading && !!currentOrgId && !!propertyId,
  });

  const createRoom = useMutation({
    mutationFn: async (room: RoomInput) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert([{
          ...room,
          org_id: currentOrgId // 🔐 ALWAYS include org_id
        } as TablesInsert<'rooms'>])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', currentOrgId, propertyId] });
      toast({
        title: "Sucesso!",
        description: "Quarto criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating room:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar quarto: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoom = useMutation({
    mutationFn: async ({ id, room }: { id: string; room: Partial<RoomInput & { last_booking_id?: string | null }> }) => {
      const { data, error } = await supabase
        .from('rooms')
        .update(room)
        .eq('id', id)
        .eq('org_id', currentOrgId) // 🔐 ALWAYS filter by org_id
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', currentOrgId, propertyId] });
      toast({
        title: "Sucesso!",
        description: "Quarto atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating room:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar quarto: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id)
        .eq('org_id', currentOrgId); // 🔐 ALWAYS filter by org_id

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', currentOrgId, propertyId] });
      toast({
        title: "Sucesso!",
        description: "Quarto removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting room:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover quarto: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    rooms: rooms || [],
    isLoading,
    error,
    createRoom,
    updateRoom,
    deleteRoom,
  };
};