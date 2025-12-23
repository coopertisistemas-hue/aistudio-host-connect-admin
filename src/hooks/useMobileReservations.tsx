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

export const useMobileReservations = (propertyId?: string) => {
    const { leads, isLoading: leadsLoading, createLead, updateLeadStatus, convertLeadToBooking } = useLeads(propertyId || "");
    const { rooms } = useRooms(propertyId);

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['mobile-reservation-stats', propertyId],
        queryFn: async () => {
            if (!propertyId) return null;

            const today = new Date().toISOString().split('T')[0];

            // 1. Get Occupied Rooms Count for Today
            // A room is occupied if a booking starts before or on today AND ends after today
            const { count: occupiedCount, error: occError } = await supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', propertyId)
                .lte('check_in', today)
                .gt('check_out', today)
                .neq('status', 'cancelled');

            if (occError) throw occError;

            // 2. Arrivals Today
            const { count: arrivalsCount, error: arrError } = await supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', propertyId)
                .eq('check_in', today)
                .neq('status', 'cancelled');

            if (arrError) throw arrError;

            // 3. Departures Today
            const { count: depCount, error: depError } = await supabase
                .from('bookings')
                .select('id', { count: 'exact', head: true })
                .eq('property_id', propertyId)
                .eq('check_out', today)
                .neq('status', 'cancelled');

            if (depError) throw depError;

            return {
                occupiedRooms: occupiedCount || 0,
                arrivalsToday: arrivalsCount || 0,
                departuresToday: depCount || 0
            };
        },
        enabled: !!propertyId
    });

    // Calculate Occupancy Rate
    const totalRooms = rooms.length;
    const occupiedRooms = stats?.occupiedRooms || 0;
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
            arrivalsToday: stats?.arrivalsToday || 0,
            departuresToday: stats?.departuresToday || 0
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
