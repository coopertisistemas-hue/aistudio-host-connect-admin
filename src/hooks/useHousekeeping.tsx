import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRooms } from './useRooms';
import { useArrivals } from './useArrivals';
import { useDepartures } from './useDepartures';
import { Room } from './useRooms';

export type HousekeepingPriority = 'high' | 'medium' | 'low';

export interface HousekeepingItem {
    room: Room;
    priority: HousekeepingPriority;
    reason: string;
    checkoutBooking?: any;
    checkinBooking?: any;
}

export const useHousekeeping = (propertyId?: string) => {
    const { rooms, isLoading: roomsLoading } = useRooms(propertyId);
    const { arrivals, isLoading: arrivalsLoading } = useArrivals(propertyId);
    const { departures, isLoading: departuresLoading } = useDepartures(propertyId);

    const isLoading = roomsLoading || arrivalsLoading || departuresLoading;

    const queue: HousekeepingItem[] = rooms
        .filter(r => r.status === 'dirty' || r.status === 'clean' || r.status === 'inspected')
        .map(room => {
            // Find bookings for this room today
            // Checkouts (Priority 1: High)
            const checkoutBooking = departures?.find(b => b.current_room_id === room.id);

            // Arrivals for this room (Priority 2: Medium)
            const checkinBooking = arrivals?.find(b =>
                // Either it's the same room or it's a new arrival for this type
                b.current_room_id === room.id || (b.status === 'confirmed' && !b.current_room_id)
            );

            let priority: HousekeepingPriority = 'low';
            let reason = 'Limpeza de rotina';

            if (checkoutBooking) {
                priority = 'high';
                reason = 'Saída hoje / Checkout';
            } else if (checkinBooking) {
                priority = 'medium';
                reason = 'Chegada hoje / Novo hóspede';
            }

            return {
                room,
                priority,
                reason,
                checkoutBooking,
                checkinBooking
            };
        })
        .sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            // First by priority
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            // Then by room number
            return a.room.room_number.localeCompare(b.room.room_number);
        });

    const kpis = {
        totalDirty: rooms.filter(r => r.status === 'dirty').length,
        urgentCheckouts: queue.filter(item => item.priority === 'high' && item.room.status === 'dirty').length,
        backlogCount: queue.filter(item => item.room.status === 'dirty').length,
    };

    return {
        queue,
        kpis,
        isLoading,
    };
};
