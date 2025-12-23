import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLeads, ReservationLead } from "./useLeads";
import { useRooms } from "./useRooms";

export interface DashboardStats {
    occupancyRate: number;
    totalRooms: number;
    occupiedRooms: number;
    arrivalsToday: number;
    departuresToday: number;
}

export interface BookingSummary {
    id: string;
    guest_name: string;
    total_guests: number;
    check_in: string;
    check_out: string;
    status: string;
    total_amount: number;
    room: {
        room_number: string;
    } | null;
}

export const useMobileReservations = (propertyId?: string) => {
    const { leads, isLoading: leadsLoading, createLead, updateLeadStatus, convertLeadToBooking } = useLeads(propertyId || "");
    const { rooms } = useRooms(propertyId);

    const { data: bookingData, isLoading: statsLoading } = useQuery({
        queryKey: ['mobile-reservation-data', propertyId],
        queryFn: async () => {
            if (!propertyId) return null;

            const today = new Date().toISOString().split('T')[0];

            // Helper to fetch bookings with room data
            const fetchBookings = async (filter: (query: any) => any) => {
                let query = supabase
                    .from('bookings')
                    .select(`
                        id,
                        guest_name,
                        total_guests,
                        check_in,
                        check_out,
                        status,
                        total_amount,
                        room:rooms(room_number)
                    `)
                    .eq('property_id', propertyId)
                    .neq('status', 'cancelled');

                query = filter(query);

                const { data, error } = await query;
                if (error) throw error;
                return data as BookingSummary[];
            };

            // 1. Occupied (In-House) - Starts <= Today AND Ends > Today
            const inHouse = await fetchBookings(q => q.lte('check_in', today).gt('check_out', today));

            // 2. Arrivals Today - Starts == Today
            const arrivals = await fetchBookings(q => q.eq('check_in', today));

            // 3. Departures Today - Ends == Today
            const departures = await fetchBookings(q => q.eq('check_out', today));

            return {
                inHouse,
                arrivals,
                departures
            };
        },
        enabled: !!propertyId
    });

    // Calculate Stats
    const totalRooms = rooms.length;
    const occupiedRooms = bookingData?.inHouse.length || 0;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // Separate Leads by Status
    const pipeline = {
        new: leads.filter(l => l.status === 'new'),
        negotiation: leads.filter(l => ['contacted', 'quoted', 'negotiation'].includes(l.status)),
        confirmed: leads.filter(l => l.status === 'won'),
        lost: leads.filter(l => l.status === 'lost')
    };

    return {
        stats: {
            occupancyRate,
            totalRooms,
            occupiedRooms,
            arrivalsToday: bookingData?.arrivals.length || 0,
            departuresToday: bookingData?.departures.length || 0
        },
        lists: {
            inHouse: bookingData?.inHouse || [],
            arrivals: bookingData?.arrivals || [],
            departures: bookingData?.departures || []
        },
        pipeline,
        leads,
        isLoading: leadsLoading || statsLoading,
        actions: {
            createLead,
            updateLeadStatus,
            convertLeadToBooking
        }
    };
};
