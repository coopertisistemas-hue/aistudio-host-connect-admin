import { useMemo } from 'react';
import { useBookings, Booking } from './useBookings';
import { startOfDay, parseISO, isSameDay } from 'date-fns';

export const useDepartures = (propertyId?: string) => {
    const { bookings, isLoading } = useBookings();
    const today = startOfDay(new Date());

    const departures = useMemo(() => {
        return bookings.filter(b => {
            if (propertyId && b.property_id !== propertyId) return false;

            const checkOutDate = parseISO(b.check_out);
            // Departing today if check-out is today and status is confirmed
            return (
                isSameDay(checkOutDate, today) &&
                b.status === 'confirmed'
            );
        });
    }, [bookings, propertyId, today]);

    return {
        departures,
        isLoading
    };
};
