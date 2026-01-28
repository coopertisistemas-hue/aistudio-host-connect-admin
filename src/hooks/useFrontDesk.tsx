import { useMemo } from 'react';
import { useRooms, Room, RoomInput } from './useRooms'; // Import RoomInput
import { useBookings, Booking } from './useBookings';
import { useInvoices } from './useInvoices';
import { useOrg } from '@/hooks/useOrg'; // Multi-tenant context
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, isSameDay } from 'date-fns'; // Import isSameDay
import { Tables, TablesInsert } from '@/integrations/supabase/types';

// Define a estrutura de dados que o Front Desk precisa
export interface RoomAllocation extends Room {
  room_type_name: string;
  current_booking: Booking | null;
  check_in_today: Booking | null;
  check_out_today: Booking | null;
}

export const useFrontDesk = (propertyId?: string) => {
  const queryClient = useQueryClient();
  const { currentOrgId } = useOrg();
  const { rooms, isLoading: roomsLoading, updateRoom } = useRooms(propertyId);
  const { bookings, isLoading: bookingsLoading, updateBooking } = useBookings();
  const { createInvoice } = useInvoices(propertyId);

  const today = startOfDay(new Date());
  const todayKey = format(today, 'yyyy-MM-dd');

  const propertyBookings = useMemo(() => {
    return bookings.filter(b => b.property_id === propertyId);
  }, [bookings, propertyId]);

  // Mapeamento de quartos para reservas ativas e diárias
  const allocatedRooms = useMemo(() => {
    if (!rooms || !propertyBookings) return [];

    const activeBookingsMap = new Map<string, Booking>(); // Map<roomId, Booking>
    const checkInsTodayMap = new Map<string, Booking>(); // Map<roomId, Booking>
    const checkOutsTodayMap = new Map<string, Booking>(); // Map<roomId, Booking>

    // 1. Identify active bookings and map them to their allocated room (if any)
    propertyBookings.forEach(b => {
      const checkInDate = parseISO(b.check_in);
      const checkOutDate = parseISO(b.check_out);

      // Check if booking is currently active (between check-in and check-out date, excluding check-out day)
      const isActive = (b.status === 'confirmed' || b.status === 'pending') &&
        isWithinInterval(today, { start: checkInDate, end: checkOutDate }) &&
        !isSameDay(today, checkOutDate); // Exclude check-out day

      if (isActive && b.current_room_id) {
        activeBookingsMap.set(b.current_room_id, b);
      }

      // Check for check-ins today
      if ((b.status === 'confirmed' || b.status === 'pending') && format(checkInDate, 'yyyy-MM-dd') === todayKey) {
        // We need to find an available room of the correct type for this check-in
        // NOTE: In a real system, this would be complex. Here, we link it to the room type.
        // For simplicity, we'll rely on the checkIn mutation to handle allocation.
        // We'll use the room type ID to find a matching room later in the map.
        // For now, we just list the booking.
      }

      // Check for check-outs today
      if ((b.status === 'confirmed' || b.status === 'pending') && format(checkOutDate, 'yyyy-MM-dd') === todayKey) {
        if (b.current_room_id) {
          checkOutsTodayMap.set(b.current_room_id, b);
        }
      }
    });

    // 2. Map rooms to their status and associated bookings
    return rooms.map(room => {
      const roomTypeName = room.room_types?.name || 'N/A';

      // Current booking is the one explicitly allocated to this room and active today
      const currentBooking = activeBookingsMap.get(room.id) || null;

      // Check-out today is the one explicitly allocated to this room
      const checkOutToday = checkOutsTodayMap.get(room.id) || null;

      // Check-in today: Find a pending/confirmed booking of this room type checking in today
      const checkInToday = propertyBookings.find(b =>
        (b.status === 'confirmed' || b.status === 'pending') &&
        format(parseISO(b.check_in), 'yyyy-MM-dd') === todayKey &&
        b.room_type_id === room.room_type_id &&
        !b.current_room_id // Only consider bookings not yet allocated
      ) || null;

      return {
        ...room,
        room_type_name: roomTypeName,
        current_booking: currentBooking,
        check_in_today: checkInToday,
        check_out_today: checkOutToday,
      } as RoomAllocation;
    });
  }, [rooms, propertyBookings, todayKey]);

  // Mutation para Check-in
  const checkInMutation = useMutation({
    mutationFn: async ({ bookingId, roomId }: { bookingId: string; roomId: string }) => {
      // 1. Update Room Status to 'occupied'
      await updateRoom.mutateAsync({ id: roomId, room: { status: 'occupied', last_booking_id: bookingId } });

      // 2. Update Booking Status to 'confirmed' (if pending) AND set current_room_id
      await updateBooking.mutateAsync({ id: bookingId, booking: { status: 'confirmed', current_room_id: roomId } });
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', currentOrgId, propertyId] });
      queryClient.invalidateQueries({ queryKey: ['bookings', currentOrgId] });
      toast({ title: "Check-in Realizado", description: `Quarto ${rooms.find(r => r.id === roomId)?.room_number} ocupado.` });
    },
    onError: (error: Error) => {
      toast({ title: "Erro no Check-in", description: error.message, variant: "destructive" });
    }
  });

  // Mutation para Check-out (Inicia o processo de pagamento/fatura)
  const checkOutStartMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const booking = propertyBookings.find(b => b.id === bookingId);
      if (!booking || !propertyId) throw new Error("Reserva não encontrada.");

      // 1. Check/Generate Invoice
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('booking_id', bookingId)
        .eq('org_id', currentOrgId) // 🔐 ALWAYS filter by org_id
        .single();

      if (existingInvoice) return existingInvoice;

      // Generate initial invoice based on booking total amount
      const newInvoiceData = {
        booking_id: bookingId,
        org_id: currentOrgId, // 🔐 ALWAYS include org_id
        property_id: propertyId,
        issue_date: new Date().toISOString(), // Convert Date to ISO string
        due_date: new Date().toISOString(),   // Convert Date to ISO string
        total_amount: booking.total_amount,
        paid_amount: 0,
        status: 'pending' as const,
      };

      const { data: newInvoice, error } = await supabase
        .from('invoices')
        .insert([newInvoiceData as TablesInsert<'invoices'>]) // Explicit cast
        .select()
        .single();

      if (error) throw error;
      return newInvoice;
    },
    onSuccess: () => {
      // No need to invalidate queries here, as the invoice dialog handles the next step
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Iniciar Check-out", description: error.message, variant: "destructive" });
    }
  });

  // Função para finalizar o Check-out após o pagamento
  const finalizeCheckOut = useMutation({
    mutationFn: async ({ bookingId, roomId }: { bookingId: string; roomId: string }) => {
      // 1. Update Booking Status to 'completed' and remove current_room_id allocation
      await updateBooking.mutateAsync({ id: bookingId, booking: { status: 'completed', current_room_id: null } });

      // 2. Update Room Status to 'available'
      await updateRoom.mutateAsync({ id: roomId, room: { status: 'available' } });
    },
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', currentOrgId, propertyId] });
      queryClient.invalidateQueries({ queryKey: ['bookings', currentOrgId] });
      toast({ title: "Check-out Concluído", description: `Quarto ${rooms.find(r => r.id === roomId)?.room_number} liberado.` });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao Finalizar Check-out", description: error.message, variant: "destructive" });
    }
  });

  return {
    allocatedRooms,
    isLoading: roomsLoading || bookingsLoading,
    checkIn: checkInMutation.mutateAsync,
    checkOutStart: checkOutStartMutation.mutateAsync,
    finalizeCheckOut: finalizeCheckOut.mutateAsync,
    updateRoomStatus: updateRoom.mutateAsync,
    propertyBookings,
  };
};
