import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { normalizeLegacyStatus } from "@/lib/constants/statuses";

type BookingRow = {
  id: string;
  property_id: string;
  status: string;
  total_amount: number | null;
};

type InvoiceRow = {
  id: string;
  booking_id: string | null;
  property_id: string;
  status: "pending" | "paid" | "partially_paid" | "cancelled";
  total_amount: number | null;
  paid_amount: number | null;
  due_date: string | null;
  created_at: string;
};

export type BillingEventRow = {
  id: string;
  eventType: string;
  invoiceId: string;
  bookingId: string | null;
  propertyId: string;
  amount: number;
  status: string;
  dueDate: string | null;
  retryStage: "none" | "d0" | "d3" | "d7" | "d14";
  createdAt: string;
};

type DunningSummary = {
  d0: number;
  d3: number;
  d7: number;
  d14: number;
};

export type BillingOrchestrationSummary = {
  totals: {
    bookedValue: number;
    invoicedValue: number;
    paidValue: number;
    outstandingValue: number;
    collectionRate: number;
  };
  reconciliation: {
    deltaBookedVsInvoiced: number;
    deltaInvoicedVsPaid: number;
    checkedOutWithoutPaidInvoice: number;
  };
  dunning: DunningSummary;
  billingEvents: BillingEventRow[];
};

function getRetryStage(status: string, dueDate: string | null): BillingEventRow["retryStage"] {
  if (!dueDate || (status !== "pending" && status !== "partially_paid")) {
    return "none";
  }

  const now = Date.now();
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due) || due >= now) {
    return "none";
  }

  const days = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  if (days <= 3) return "d0";
  if (days <= 7) return "d3";
  if (days <= 14) return "d7";
  return "d14";
}

function mapInvoiceStatusToEvent(status: InvoiceRow["status"], retryStage: BillingEventRow["retryStage"]): string {
  if (status === "paid") return "billing.payment.paid";
  if (status === "cancelled") return "billing.payment.cancelled";
  if (status === "partially_paid") return retryStage === "none" ? "billing.payment.partial" : "billing.payment.failed";
  if (retryStage !== "none") return "billing.payment.failed";
  return "billing.payment.pending";
}

function isBookedStatus(status: string): boolean {
  const normalized = normalizeLegacyStatus(status);
  return normalized !== "cancelled" && normalized !== "no_show";
}

function isCheckedOutStatus(status: string): boolean {
  return normalizeLegacyStatus(status) === "checked_out";
}

export const useBillingOrchestration = () => {
  const { currentOrgId } = useOrg();
  const { selectedPropertyId } = useSelectedProperty();

  const { data, isLoading, error } = useQuery({
    queryKey: ["billing-orchestration", currentOrgId, selectedPropertyId],
    enabled: !!currentOrgId && !!selectedPropertyId,
    queryFn: async () => {
      if (!currentOrgId || !selectedPropertyId) {
        return {
          bookings: [] as BookingRow[],
          invoices: [] as InvoiceRow[],
        };
      }

      const [bookingsRes, invoicesRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, property_id, status, total_amount")
          .eq("org_id", currentOrgId)
          .eq("property_id", selectedPropertyId),
        supabase
          .from("invoices")
          .select("id, booking_id, property_id, status, total_amount, paid_amount, due_date, created_at")
          .eq("org_id", currentOrgId)
          .eq("property_id", selectedPropertyId),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (invoicesRes.error) throw invoicesRes.error;

      return {
        bookings: (bookingsRes.data ?? []) as BookingRow[],
        invoices: (invoicesRes.data ?? []) as InvoiceRow[],
      };
    },
  });

  const summary = useMemo<BillingOrchestrationSummary>(() => {
    const bookings = data?.bookings ?? [];
    const invoices = data?.invoices ?? [];

    const bookedValue = bookings
      .filter((booking) => isBookedStatus(booking.status))
      .reduce((acc, booking) => acc + Number(booking.total_amount ?? 0), 0);

    const invoicedValue = invoices.reduce((acc, invoice) => acc + Number(invoice.total_amount ?? 0), 0);
    const paidValue = invoices.reduce((acc, invoice) => acc + Number(invoice.paid_amount ?? 0), 0);
    const outstandingValue = Math.max(0, invoicedValue - paidValue);
    const collectionRate = invoicedValue > 0 ? (paidValue / invoicedValue) * 100 : 0;

    const billingEvents = invoices
      .map<BillingEventRow>((invoice) => {
        const retryStage = getRetryStage(invoice.status, invoice.due_date);
        return {
          id: `${invoice.id}:${retryStage}`,
          eventType: mapInvoiceStatusToEvent(invoice.status, retryStage),
          invoiceId: invoice.id,
          bookingId: invoice.booking_id,
          propertyId: invoice.property_id,
          amount: Number(invoice.total_amount ?? 0),
          status: invoice.status,
          dueDate: invoice.due_date,
          retryStage,
          createdAt: invoice.created_at,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const dunning = billingEvents.reduce<DunningSummary>(
      (acc, event) => {
        if (event.retryStage === "d0") acc.d0 += 1;
        if (event.retryStage === "d3") acc.d3 += 1;
        if (event.retryStage === "d7") acc.d7 += 1;
        if (event.retryStage === "d14") acc.d14 += 1;
        return acc;
      },
      { d0: 0, d3: 0, d7: 0, d14: 0 },
    );

    const invoicesByBooking = new Map<string, InvoiceRow>();
    invoices.forEach((invoice) => {
      if (invoice.booking_id) {
        invoicesByBooking.set(invoice.booking_id, invoice);
      }
    });

    const checkedOutWithoutPaidInvoice = bookings.filter((booking) => {
      if (!isCheckedOutStatus(booking.status)) return false;
      const invoice = invoicesByBooking.get(booking.id);
      if (!invoice) return true;
      return invoice.status !== "paid";
    }).length;

    return {
      totals: {
        bookedValue: Number(bookedValue.toFixed(2)),
        invoicedValue: Number(invoicedValue.toFixed(2)),
        paidValue: Number(paidValue.toFixed(2)),
        outstandingValue: Number(outstandingValue.toFixed(2)),
        collectionRate: Number(collectionRate.toFixed(1)),
      },
      reconciliation: {
        deltaBookedVsInvoiced: Number((bookedValue - invoicedValue).toFixed(2)),
        deltaInvoicedVsPaid: Number((invoicedValue - paidValue).toFixed(2)),
        checkedOutWithoutPaidInvoice,
      },
      dunning,
      billingEvents,
    };
  }, [data?.bookings, data?.invoices]);

  return {
    summary,
    isLoading,
    error,
  };
};

