import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { safeLogger } from '@/lib/logging/safeLogger';

import { useOrg } from '@/hooks/useOrg'; // Multi-tenant context

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

  const { data: rooms, isLoading, error, refetch } = useQuery({
    queryKey: ['rooms', currentOrgId, propertyId],
    queryFn: async () => {
      if (!currentOrgId) {
        safeLogger.warn('rooms.fetch.no_org');
        return [];
      }
      if (!propertyId) {
        safeLogger.warn('rooms.fetch.no_property');
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
        safeLogger.error('rooms.fetch.error', { message: error.message });
        throw error;
      }
      return data as Room[];
    },
    enabled: !isOrgLoading && !!currentOrgId && !!propertyId,
  });

  const createRoom = useMutation<unknown, Error, RoomInput>({
    mutationFn: async (room: RoomInput) => {
      const { data, error } = await (supabase as any)
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
      safeLogger.error('rooms.create.error', { message: error.message });
      toast({
        title: "Erro",
        description: "Erro ao criar quarto: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoom = useMutation<unknown, Error, { id: string; room: any }>({
    mutationFn: async ({ id, room }: { id: string; room: any }) => {
      const { data, error } = await (supabase as any)
        .from('rooms')
        .update(room as any)
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
      safeLogger.error('rooms.update.error', { message: error.message });
      toast({
        title: "Erro",
        description: "Erro ao atualizar quarto: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoom = useMutation<unknown, Error, string>({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
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
      safeLogger.error('rooms.delete.error', { message: error.message });
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
    refetch, // Expose refetch
    createRoom,
    updateRoom,
    deleteRoom,
  };
};
