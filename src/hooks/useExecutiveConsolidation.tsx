import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { startOfMonth, endOfMonth, differenceInDays, parseISO } from "date-fns";

type ConsolidatedBookingRow = {
  id: string;
  property_id: string;
  status: string;
  total_amount: number | null;
  check_in: string;
  check_out: string;
};

type ConsolidatedExpenseRow = {
  id: string;
  property_id: string;
  amount: number | null;
  payment_status: string | null;
};

type ConsolidatedPropertyRow = {
  id: string;
  name: string;
  status: string;
  total_rooms: number | null;
};

type PropertyExecutiveRow = {
  propertyId: string;
  propertyName: string;
  revenue: number;
  bookings: number;
  expenses: number;
  net: number;
};

export type ExecutiveConsolidationData = {
  totals: {
    activeProperties: number;
    totalBookings: number;
    grossRevenue: number;
    totalExpenses: number;
    netResult: number;
    occupancyRate: number;
  };
  risk: {
    propertiesWithoutBookings: number;
    overdueExpenses: number;
  };
  topProperties: PropertyExecutiveRow[];
};

function isRevenueStatus(status: string): boolean {
  return status !== "cancelled";
}

export const useExecutiveConsolidation = () => {
  const { currentOrgId, isLoading: isOrgLoading } = useOrg();

  const { data, isLoading, error } = useQuery({
    queryKey: ["executive-consolidation", currentOrgId],
    enabled: !isOrgLoading && !!currentOrgId,
    queryFn: async () => {
      if (!currentOrgId) {
        return {
          bookings: [] as ConsolidatedBookingRow[],
          expenses: [] as ConsolidatedExpenseRow[],
          properties: [] as ConsolidatedPropertyRow[],
        };
      }

      const [bookingsRes, expensesRes, propertiesRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, property_id, status, total_amount, check_in, check_out")
          .eq("org_id", currentOrgId),
        supabase
          .from("expenses")
          .select("id, property_id, amount, payment_status")
          .eq("org_id", currentOrgId),
        supabase
          .from("properties")
          .select("id, name, status, total_rooms")
          .eq("org_id", currentOrgId),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (propertiesRes.error) throw propertiesRes.error;

      return {
        bookings: (bookingsRes.data ?? []) as ConsolidatedBookingRow[],
        expenses: (expensesRes.data ?? []) as ConsolidatedExpenseRow[],
        properties: (propertiesRes.data ?? []) as ConsolidatedPropertyRow[],
      };
    },
  });

  const summary = useMemo<ExecutiveConsolidationData>(() => {
    const bookings = data?.bookings ?? [];
    const expenses = data?.expenses ?? [];
    const properties = data?.properties ?? [];

    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    const periodDays = Math.max(1, differenceInDays(monthEnd, monthStart));

    const activeProperties = properties.filter((property) => property.status === "active");
    const totalRooms = activeProperties.reduce((acc, property) => acc + Number(property.total_rooms ?? 0), 0);

    const revenueBookings = bookings.filter((booking) => isRevenueStatus(booking.status));
    const grossRevenue = revenueBookings.reduce((acc, booking) => acc + Number(booking.total_amount ?? 0), 0);
    const totalExpenses = expenses.reduce((acc, expense) => acc + Number(expense.amount ?? 0), 0);

    const occupiedRoomNights = revenueBookings.reduce((acc, booking) => {
      const checkIn = parseISO(booking.check_in);
      const checkOut = parseISO(booking.check_out);
      const overlapStart = checkIn > monthStart ? checkIn : monthStart;
      const overlapEnd = checkOut < monthEnd ? checkOut : monthEnd;
      const nights = differenceInDays(overlapEnd, overlapStart);
      return acc + Math.max(0, nights);
    }, 0);

    const availableRoomNights = totalRooms * periodDays;
    const occupancyRate = availableRoomNights > 0 ? (occupiedRoomNights / availableRoomNights) * 100 : 0;

    const propertyMap = new Map<string, PropertyExecutiveRow>();
    activeProperties.forEach((property) => {
      propertyMap.set(property.id, {
        propertyId: property.id,
        propertyName: property.name,
        revenue: 0,
        bookings: 0,
        expenses: 0,
        net: 0,
      });
    });

    revenueBookings.forEach((booking) => {
      const row = propertyMap.get(booking.property_id);
      if (!row) return;
      row.revenue += Number(booking.total_amount ?? 0);
      row.bookings += 1;
    });

    expenses.forEach((expense) => {
      const row = propertyMap.get(expense.property_id);
      if (!row) return;
      row.expenses += Number(expense.amount ?? 0);
    });

    const topProperties = Array.from(propertyMap.values())
      .map((row) => ({ ...row, net: row.revenue - row.expenses }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const propertiesWithBookings = new Set(revenueBookings.map((booking) => booking.property_id));
    const propertiesWithoutBookings = activeProperties.filter((property) => !propertiesWithBookings.has(property.id)).length;
    const overdueExpenses = expenses.filter((expense) => expense.payment_status === "overdue").length;

    return {
      totals: {
        activeProperties: activeProperties.length,
        totalBookings: bookings.length,
        grossRevenue: Number(grossRevenue.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netResult: Number((grossRevenue - totalExpenses).toFixed(2)),
        occupancyRate: Number(occupancyRate.toFixed(1)),
      },
      risk: {
        propertiesWithoutBookings,
        overdueExpenses,
      },
      topProperties,
    };
  }, [data]);

  return {
    summary,
    isLoading,
    error,
  };
};

