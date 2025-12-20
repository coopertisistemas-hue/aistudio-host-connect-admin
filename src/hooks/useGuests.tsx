import { useMemo } from 'react';
import { useBookings } from './useBookings';

export interface Guest {
  name: string;
  email: string;
  phone: string | null;
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  bookings: Array<{
    id: string;
    property: string;
    checkIn: string;
    checkOut: string;
    status: string;
    amount: number;
  }>;
}

export const useGuests = () => {
  const { bookings, isLoading } = useBookings();

  const guests = useMemo(() => {
    const guestMap = new Map<string, Guest>();

    bookings.forEach((booking) => {
      const email = booking.guest_email;
      
      if (guestMap.has(email)) {
        const guest = guestMap.get(email)!;
        guest.totalBookings += 1;
        guest.totalSpent += Number(booking.total_amount);
        guest.bookings.push({
          id: booking.id,
          property: booking.properties?.name || 'N/A',
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          status: booking.status,
          amount: Number(booking.total_amount),
        });
        
        // Update last visit if this booking is more recent
        if (new Date(booking.check_in) > new Date(guest.lastVisit)) {
          guest.lastVisit = booking.check_in;
        }
      } else {
        guestMap.set(email, {
          name: booking.guest_name,
          email: booking.guest_email,
          phone: booking.guest_phone,
          totalBookings: 1,
          totalSpent: Number(booking.total_amount),
          lastVisit: booking.check_in,
          bookings: [
            {
              id: booking.id,
              property: booking.properties?.name || 'N/A',
              checkIn: booking.check_in,
              checkOut: booking.check_out,
              status: booking.status,
              amount: Number(booking.total_amount),
            },
          ],
        });
      }
    });

    return Array.from(guestMap.values()).sort(
      (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
    );
  }, [bookings]);

  return {
    guests,
    isLoading,
    totalGuests: guests.length,
  };
};
