import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert

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

  const { data: rooms, isLoading, error } = useQuery({
    queryKey: ['rooms', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          room_types (
            name
          )
        `)
        .eq('property_id', propertyId)
        .order('room_number', { ascending: true });

      if (error) throw error;
      return data as Room[];
    },
    enabled: !!propertyId,
  });

  const createRoom = useMutation({
    mutationFn: async (room: RoomInput) => {
      const { data, error } = await supabase
        .from('rooms')
        .insert([room as TablesInsert<'rooms'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
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
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
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
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
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