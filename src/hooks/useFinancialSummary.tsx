import { useMemo } from 'react';
import { useBookings } from './useBookings';
import { useProperties } from './useProperties';
import { differenceInDays, parseISO, startOfDay, endOfDay } from 'date-fns';
import { BookingStatus, normalizeLegacyStatus } from '@/lib/constants/statuses';
import { useTenantContext } from '@/platform/tenant';

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalBookings: number;
  occupancyRate: number; // %
  adr: number; // Average Daily Rate
  revpar: number; // Revenue Per Available Room
  totalAvailableRooms: number;
}

// Helper function to calculate occupied room nights within a period
type FinancialBooking = {
  check_in: string;
  check_out: string;
  status: string;
};

const isRevenueEligible = (status: string): boolean => {
  const normalized = normalizeLegacyStatus(status);
  return (
    normalized === BookingStatus.CHECKED_IN ||
    normalized === BookingStatus.IN_HOUSE ||
    normalized === BookingStatus.CHECKED_OUT
  );
};

const calculateOccupiedRoomNights = (bookings: FinancialBooking[], startDate: Date, endDate: Date) => {
  let occupiedNights = 0;

  bookings.forEach(booking => {
    const checkIn = parseISO(booking.check_in);
    const checkOut = parseISO(booking.check_out);

    if (!isRevenueEligible(booking.status)) return;

    // Calculate overlap between booking period and reporting period
    const intervalStart = startOfDay(startDate);
    const intervalEnd = endOfDay(endDate);

    const overlapStart = checkIn > intervalStart ? checkIn : intervalStart;
    const overlapEnd = checkOut < intervalEnd ? checkOut : intervalEnd;

    if (overlapStart < overlapEnd) {
      // We count nights, so we exclude the check-out day
      const nights = differenceInDays(overlapEnd, overlapStart);
      if (nights > 0) {
        occupiedNights += nights;
      }
    }
  });

  return occupiedNights;
};

export const useFinancialSummary = (propertyId?: string, dateRange?: { from: Date, to: Date }) => {
  const { currentPropertyId } = useTenantContext();
  const scopedPropertyId = propertyId ?? currentPropertyId ?? undefined;
  const { bookings, isLoading: bookingsLoading } = useBookings(scopedPropertyId);
  const { properties, isLoading: propertiesLoading } = useProperties();

  const summary = useMemo<FinancialSummary>(() => {
    if (bookingsLoading || propertiesLoading) {
      return {
        totalRevenue: 0, totalExpenses: 0, netProfit: 0, totalBookings: 0,
        occupancyRate: 0, adr: 0, revpar: 0, totalAvailableRooms: 0
      };
    }

    const targetProperties = scopedPropertyId
      ? properties.filter(p => p.id === scopedPropertyId)
      : properties;

    const targetBookings = scopedPropertyId
      ? bookings.filter(b => b.property_id === scopedPropertyId)
      : bookings;

    const totalAvailableRooms = targetProperties.reduce((sum, p) => sum + p.total_rooms, 0);

    const startDate = dateRange?.from || new Date(0); // Start of time if no range
    const endDate = dateRange?.to || new Date();

    const totalNightsInPeriod = differenceInDays(endDate, startDate);
    const totalRoomNightsAvailable = totalAvailableRooms * totalNightsInPeriod;

    const revenueBookings = targetBookings.filter(b => isRevenueEligible(b.status));
    const totalRevenue = revenueBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
    const totalBookingsCount = targetBookings.length;

    // Operational Metrics Calculation
    let occupancyRate = 0;
    let adr = 0;
    let revpar = 0;

    if (totalRoomNightsAvailable > 0) {
      const occupiedRoomNights = calculateOccupiedRoomNights(revenueBookings, startDate, endDate);

      occupancyRate = (occupiedRoomNights / totalRoomNightsAvailable) * 100;

      if (occupiedRoomNights > 0) {
        adr = totalRevenue / occupiedRoomNights;
      }

      revpar = totalRevenue / totalRoomNightsAvailable;
    }

    // Note: Expenses are handled separately in Financial.tsx, but included here for completeness if needed later.
    // For now, we rely on Financial.tsx to combine revenue and expenses.

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpenses: 0, // Placeholder, calculated in Financial.tsx
      netProfit: 0, // Placeholder, calculated in Financial.tsx
      totalBookings: totalBookingsCount,
      occupancyRate: Number(occupancyRate.toFixed(1)),
      adr: Number(adr.toFixed(2)),
      revpar: Number(revpar.toFixed(2)),
      totalAvailableRooms,
    };
  }, [bookings, properties, scopedPropertyId, dateRange, bookingsLoading, propertiesLoading]);

  return {
    summary,
    isLoading: bookingsLoading || propertiesLoading,
    bookingsLoading,
    propertiesLoading
  };
};
