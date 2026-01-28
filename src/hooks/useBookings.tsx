import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Service } from './useServices';
import { useNotifications } from './useNotifications';
import { Tables, TablesInsert } from '@/integrations/supabase/types'; // Import TablesInsert
import { useOrg } from '@/hooks/useOrg'; // Multi-tenant context

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
  total_guests: z.number().min(1, "Informe ao menos um hóspede."),
  total_amount: z.number().min(0, "O valor total não pode ser negativo."),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
  notes: z.string().optional().nullable(),
  services_json: z.array(z.string()).optional().nullable(),
  current_room_id: z.string().optional().nullable(),
}).refine((data) => data.check_out > data.check_in, {
  message: "A data de saída deve ser posterior à entrada.",
  path: ["check_out"],
});

export type BookingInput = z.infer<typeof bookingSchema>;

export const useBookings = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const { createNotification } = useNotifications();
  const { currentOrgId, isLoading: isOrgLoading } = useOrg(); // Get current org context

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['bookings', currentOrgId, propertyId], // Include org_id in cache key
    queryFn: async () => {
      // ⚠️ SECURITY: Abort if no org_id - prevents fetching all bookings
      if (!currentOrgId) {
        console.warn('[useBookings] Abortando fetch: currentOrgId indefinido.');
        return [];
      }

      console.log('[useBookings] Fetching bookings...', { currentOrgId, propertyId });

      let query = (supabase
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
        `) as any)
        .eq('org_id', currentOrgId); // 🔐 ALWAYS filter by org_id first

      // Optional property-level filtering
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query
        .order('check_in', { ascending: false }) // Recent check-ins first
        .order('created_at', { ascending: false }) // Stable secondary sort
        .limit(200); // Reasonable limit for Front Desk operations

      if (error) {
        console.error('[useBookings] Error fetching bookings:', error);
        throw error;
      }

      if (!data) {
        console.log('[useBookings] No bookings found');
        return [];
      }

      console.log(`[useBookings] Successfully fetched ${data.length} bookings`);

      // Collect all unique service IDs to fetch them in a single query (batch)
      const allServiceIds = Array.from(new Set(data.flatMap(b => b.services_json || []))) as string[];

      let servicesMap: Record<string, Service> = {};

      if (allServiceIds.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name, price, is_per_person, is_per_day')
          .in('id', allServiceIds);

        if (servicesError) {
          console.error('[useBookings] Error fetching services batch:', servicesError);
        } else if (servicesData) {
          servicesData.forEach(s => {
            servicesMap[s.id] = s as Service;
          });
        }
      }

      // Map services back to each booking
      const bookingsWithServiceDetails = data.map((booking) => ({
        ...booking,
        service_details: (booking.services_json || [])
          .map(id => servicesMap[id])
          .filter(Boolean) as Service[]
      }));

      return bookingsWithServiceDetails as Booking[];
    },
    enabled: !isOrgLoading && !!currentOrgId, // Enable only when org is loaded
  });

  const createBooking = useMutation({
    mutationFn: async (booking: BookingInput) => {
      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          ...booking,
          org_id: currentOrgId, // 🔐 ALWAYS include org_id
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
      queryClient.invalidateQueries({ queryKey: ['bookings', currentOrgId] });
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
        .eq('org_id', currentOrgId) // 🔐 ALWAYS filter by org_id
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentOrgId] });
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
        .eq('id', id)
        .eq('org_id', currentOrgId); // 🔐 ALWAYS filter by org_id

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings', currentOrgId] });
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
    isPending: (bookings === undefined && !!propertyId), // Manual check for v5 consistency if needed
    isFetching: false, // placeholder or use actual if needed
    error,
    createBooking,
    updateBooking,
    deleteBooking,
  };
};
