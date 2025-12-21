import { useMemo } from 'react';
import { useBookings, Booking } from './useBookings';
import { startOfDay, parseISO, isSameDay } from 'date-fns';

export const useArrivals = (propertyId?: string) => {
    const { bookings, isLoading } = useBookings();
    const today = startOfDay(new Date());

    const arrivals = useMemo(() => {
        return bookings.filter(b => {
            if (propertyId && b.property_id !== propertyId) return false;

            const checkInDate = parseISO(b.check_in);
            // Arriving today if check-in is today and status is confirmed/pending
            return (
                isSameDay(checkInDate, today) &&
                (b.status === 'confirmed' || b.status === 'pending')
            );
        });
    }, [bookings, propertyId, today]);

    return {
        arrivals,
        isLoading
    };
};
