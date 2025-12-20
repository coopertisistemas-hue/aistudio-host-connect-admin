import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Amenity } from './useAmenities'; // Import Amenity type
import { TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert

export const roomTypeSchema = z.object({
  property_id: z.string().min(1, "A propriedade é obrigatória."),
  name: z.string().min(1, "O nome do tipo de acomodação é obrigatório."),
  description: z.string().optional().nullable(),
  capacity: z.number().min(1, "A capacidade deve ser no mínimo 1 hóspede."),
  base_price: z.number().min(0, "O preço base não pode ser negativo."),
  status: z.enum(['active', 'inactive']).default('active'),
  amenities_json: z.array(z.string()).optional().nullable(), // Storing as JSONB for now
});

export type RoomType = {
  id: string;
  property_id: string;
  name: string;
  description: string | null;
  capacity: number;
  base_price: number;
  status: 'active' | 'inactive';
  amenities_json: string[] | null; // Array of amenity IDs or names
  created_at: string;
  updated_at: string;
  // Add a field to store resolved amenity details
  amenity_details?: Amenity[];
};

export type RoomTypeInput = z.infer<typeof roomTypeSchema>;

export const useRoomTypes = (propertyId?: string) => {
  const queryClient = useQueryClient();

  const { data: roomTypes, isLoading, error } = useQuery({
    queryKey: ['room_types', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .eq('property_id', propertyId)
        .order('name', { ascending: true });

      if (error) throw error;

      // Fetch amenity details for each room type
      const roomTypesWithAmenities = await Promise.all(
        data.map(async (roomType) => {
          if (roomType.amenities_json && roomType.amenities_json.length > 0) {
            const { data: amenitiesData, error: amenitiesError } = await supabase
              .from('amenities')
              .select('id, name, icon')
              .in('id', roomType.amenities_json);

            if (amenitiesError) {
              console.error('Error fetching amenities for room type:', amenitiesError);
              return { ...roomType, amenity_details: [] };
            }
            return { ...roomType, amenity_details: amenitiesData as Amenity[] };
          }
          return { ...roomType, amenity_details: [] };
        })
      );
      
      return roomTypesWithAmenities as RoomType[];
    },
    enabled: !!propertyId, // Only run query if propertyId is provided
  });

  const createRoomType = useMutation({
    mutationFn: async (roomType: RoomTypeInput) => {
      const { data, error } = await supabase
        .from('room_types')
        .insert([{ ...roomType, amenities_json: roomType.amenities_json || [] } as TablesInsert<'room_types'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room_types', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Tipo de acomodação criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating room type:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tipo de acomodação: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoomType = useMutation({
    mutationFn: async ({ id, roomType }: { id: string; roomType: Partial<RoomTypeInput> }) => {
      const updateData: any = { ...roomType };
      if (roomType.amenities_json) {
        updateData.amenities_json = roomType.amenities_json;
      }

      const { data, error } = await supabase
        .from('room_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room_types', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Tipo de acomodação atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating room type:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de acomodação: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRoomType = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room_types', propertyId] });
      toast({
        title: "Sucesso!",
        description: "Tipo de acomodação removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting room type:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover tipo de acomodação: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    roomTypes: roomTypes || [],
    isLoading,
    error,
    createRoomType,
    updateRoomType,
    deleteRoomType,
  };
};