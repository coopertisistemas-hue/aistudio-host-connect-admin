import React, { useState, useMemo } from 'react';
import { format, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Booking } from '@/hooks/useBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { getStatusBadge } from '@/lib/ui-helpers';
import { Building2, Users, DollarSign } from 'lucide-react';

interface BookingCalendarProps {
  bookings: Booking[];
  onSelectBooking?: (booking: Booking) => void;
  onSelectDate?: (date: Date) => void;
}

const BookingCalendar = ({ bookings, onSelectBooking, onSelectDate }: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach(booking => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      
      // Iterate over each day in the booking interval
      let currentDate = checkIn;
      while (currentDate <= checkOut) {
        const dayKey = format(currentDate, 'yyyy-MM-dd');
        if (!map.has(dayKey)) {
          map.set(dayKey, []);
        }
        map.get(dayKey)?.push(booking);
        currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
      }
    });
    return map;
  }, [bookings]);

  const modifiers = {
    booked: (date: Date) => {
      const dayKey = format(date, 'yyyy-MM-dd');
      return bookingsByDay.has(dayKey);
    },
  };

  const modifiersClassNames = {
    booked: 'bg-primary text-primary-foreground rounded-md', // Tailwind classes for booked days
  };

  const handleDayClick = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && onSelectDate) {
      onSelectDate(date);
    }
  };

  const bookingsForSelectedDay = selectedDate
    ? bookingsByDay.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Card className="flex-1 lg:max-w-[700px]">
        <CardHeader>
          <CardTitle>Calendário de Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDayClick}
            locale={ptBR}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Reservas em {selectedDate ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Nenhum dia selecionado'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {bookingsForSelectedDay.length > 0 ? (
            bookingsForSelectedDay.map((booking) => (
              <div key={booking.id} className="border p-3 rounded-md hover:bg-muted/50 cursor-pointer" onClick={() => onSelectBooking?.(booking)}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold">{booking.guest_name}</p>
                  {getStatusBadge(booking.status as any)}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {booking.properties?.name || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" /> {booking.total_guests} hóspedes
                </p>
                <p className="text-sm font-medium text-success flex items-center gap-1 mt-1">
                  <DollarSign className="h-3 w-3" /> R$ {booking.total_amount.toFixed(2)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">Nenhuma reserva para este dia.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingCalendar;