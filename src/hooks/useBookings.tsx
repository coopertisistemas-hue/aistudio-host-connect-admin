import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Service } from './useServices';
import { useNotifications } from './useNotifications';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert

// Definindo o tipo de retorno da query de bookings com joins
type BookingRow = Tables<'bookings'>;
type PropertyRow = Tables<'properties'>;
type RoomTypeRow = Tables<'room_types'>;

export type Booking = BookingRow & {
  properties?: Pick<PropertyRow, 'name' | 'city'> | null;
  room_types?: Pick<RoomTypeRow, 'name'> | null;
  service_details?: Service[];
  current_room_id: string | null; // Adicionado current_room_id
};

export const bookingSchema = z.object({
  property_id: z.string().min(1, "A propriedade é obrigatória."),
  room_type_id: z.string().min(1, "O tipo de acomodação é obrigatório."),
  guest_name: z.string().min(1, "O nome do hóspede é obrigatório."),
  guest_email: z.string().email("Email inválido.").min(1, "O email do hóspede é obrigatório."),
  guest_phone: z.string().optional().nullable(),
  check_in: z.date({ required_error: "A data de check-in é obrigatória." }),
  check_out: z.date({ required_error: "A data de check-out é obrigatória." }),
  total_guests: z.number().min(1, "O número de hóspedes deve ser no mínimo 1."),
  total_amount: z.number().min(0, "O valor total não pode ser negativo."),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
  notes: z.string().optional().nullable(),
  services_json: z.array(z.string()).optional().nullable(),
  current_room_id: z.string().optional().nullable(), // Adicionado ao schema
}).refine((data) => data.check_out > data.check_in, {
  message: "A data de check-out deve ser posterior à data de check-in.",
  path: ["check_out"],
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const useBookings = () => {
  const queryClient = useQueryClient();
  const { createNotification } = useNotifications();

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          properties (
            name,
            city
          ),
          room_types (
            name
          )
        `)
        .order('check_in', { ascending: false });

      if (error) throw error;

      const bookingsWithServiceDetails = await Promise.all(
        data.map(async (booking) => {
          if (booking.services_json && booking.services_json.length > 0) {
            const { data: servicesData, error: servicesError } = await supabase
              .from('services')
              .select('id, name, price, is_per_person, is_per_day')
              .in('id', booking.services_json);

            if (servicesError) {
              console.error('Error fetching services for booking:', servicesError);
              return { ...booking, service_details: [] };
            }
            return { ...booking, service_details: servicesData as Service[] };
          }
          return { ...booking, service_details: [] };
        })
      );
      
      return bookingsWithServiceDetails as Booking[];
    },
  });

  const createBooking = useMutation({
    mutationFn: async (booking: BookingInput) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...booking,
          check_in: booking.check_in.toISOString().split('T')[0],
          check_out: booking.check_out.toISOString().split('T')[0],
          services_json: booking.services_json || [],
          current_room_id: booking.current_room_id || null, // Ensure current_room_id is passed
        } as TablesInsert<'bookings'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (newBooking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Sucesso!",
        description: "Reserva criada com sucesso.",
      });

      // Fetch property owner's ID for notification
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('user_id, name')
        .eq('id', newBooking.property_id)
        .single();

      if (propertyError) {
        console.error('Error fetching property owner for notification:', propertyError);
        return;
      }

      if (propertyData?.user_id) {
        createNotification.mutate({
          type: 'new_booking',
          message: `Nova reserva de ${newBooking.guest_name} para ${propertyData.name}.`,
          userId: propertyData.user_id,
          is_read: false, // Adicionado is_read
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error creating booking:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar reserva: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, booking }: { id: string; booking: Partial<BookingInput & { current_room_id?: string | null }> }) => {
      const updateData: any = { ...booking };
      
      if (booking.check_in) {
        updateData.check_in = booking.check_in.toISOString().split('T')[0];
      }
      if (booking.check_out) {
        updateData.check_out = booking.check_out.toISOString().split('T')[0];
      }
      if (booking.services_json) {
        updateData.services_json = booking.services_json;
      }

      const { data, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Sucesso!",
        description: "Reserva atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error updating booking:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar reserva: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBooking = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast({
        title: "Sucesso!",
        description: "Reserva removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting booking:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover reserva: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    bookings: bookings || [],
    isLoading,
    error,
    createBooking,
    updateBooking,
    deleteBooking,
  };
};