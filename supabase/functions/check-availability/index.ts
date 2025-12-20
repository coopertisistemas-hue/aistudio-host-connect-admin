import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    const { property_id, room_type_id, check_in, check_out, total_guests } = await req.json();

    if (!property_id || !room_type_id || !check_in || !check_out || !total_guests) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get room type capacity
    const { data: roomType, error: roomTypeError } = await supabaseClient
      .from('room_types')
      .select('capacity')
      .eq('id', room_type_id)
      .eq('property_id', property_id)
      .single();

    if (roomTypeError || !roomType) {
      console.error('Error fetching room type:', roomTypeError);
      return new Response(JSON.stringify({ error: 'Room type not found or inaccessible' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    if (total_guests > roomType.capacity) {
      return new Response(JSON.stringify({ available: false, message: 'Number of guests exceeds room type capacity' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Get total rooms of this type for the property
    const { data: totalRooms, error: totalRoomsError } = await supabaseClient
      .from('rooms')
      .select('id')
      .eq('property_id', property_id)
      .eq('room_type_id', room_type_id)
      .eq('status', 'available'); // Only consider available rooms

    if (totalRoomsError) {
      console.error('Error fetching total rooms:', totalRoomsError);
      return new Response(JSON.stringify({ error: 'Error fetching total rooms' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const totalAvailableRooms = totalRooms.length;

    // 3. Count occupied rooms for the given period
    const { data: occupiedBookings, error: occupiedBookingsError } = await supabaseClient
      .from('bookings')
      .select('id')
      .eq('property_id', property_id)
      .eq('room_type_id', room_type_id)
      .in('status', ['pending', 'confirmed']) // Consider pending and confirmed bookings as occupied
      .lt('check_in', check_out) // Booking starts before requested check_out
      .gt('check_out', check_in); // Booking ends after requested check_in

    if (occupiedBookingsError) {
      console.error('Error fetching occupied bookings:', occupiedBookingsError);
      return new Response(JSON.stringify({ error: 'Error fetching occupied bookings' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const occupiedRoomsCount = occupiedBookings.length;
    const remainingAvailableRooms = totalAvailableRooms - occupiedRoomsCount;

    const available = remainingAvailableRooms > 0;
    const message = available
      ? `Available rooms: ${remainingAvailableRooms}`
      : 'No rooms available for the selected period.';

    return new Response(JSON.stringify({ available, remainingAvailableRooms, message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in check-availability function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});