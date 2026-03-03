import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useSelectedProperty } from "@/hooks/useSelectedProperty";
import { normalizeLegacyStatus } from "@/lib/constants/statuses";
import { deriveSubscriptionSnapshot } from "@/lib/monetization/subscriptionLifecycle";

type BookingRow = {
  id: string;
  status: string;
  total_amount: number | null;
};

type InvoiceRow = {
  id: string;
  booking_id: string | null;
  status: "pending" | "paid" | "partially_paid" | "cancelled";
  total_amount: number | null;
  paid_amount: number | null;
  due_date: string | null;
};

type ProfileRow = {
  plan: string | null;
  plan_status: string | null;
  trial_expires_at: string | null;
};

export type RevenueAssuranceSummary = {
  subscription: {
    plan: string;
    sourceStatus: string;
    effectiveStatus: string;
  };
  totals: {
    bookedValue: number;
    invoicedValue: number;
    paidValue: number;
    outstandingValue: number;
    overdueInvoices: number;
  };
  reconciliation: {
    bookingsWithoutInvoice: number;
    paidInvoicesWithoutBooking: number;
    checkedOutWithoutPaidInvoice: number;
    deltaBookedVsInvoiced: number;
    deltaInvoicedVsPaid: number;
  };
  leakageSignals: Array<{
    code: string;
    severity: "low" | "medium" | "high";
    count: number;
    description: string;
  }>;
  goNoGo: {
    status: "GO" | "NO_GO";
    reasons: string[];
  };
};

function isBookedStatus(status: string): boolean {
  const normalized = normalizeLegacyStatus(status);
  return normalized !== "cancelled" && normalized !== "no_show";
}

function isCheckedOutStatus(status: string): boolean {
  return normalizeLegacyStatus(status) === "checked_out";
}

export const useRevenueAssurance = () => {
  const { currentOrgId } = useOrg();
  const { selectedPropertyId } = useSelectedProperty();

  const { data, isLoading, error } = useQuery({
    queryKey: ["revenue-assurance", currentOrgId, selectedPropertyId],
    enabled: !!currentOrgId && !!selectedPropertyId,
    queryFn: async () => {
      if (!currentOrgId || !selectedPropertyId) {
        return {
          bookings: [] as BookingRow[],
          invoices: [] as InvoiceRow[],
          profile: null as ProfileRow | null,
        };
      }

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("owner_id")
        .eq("id", currentOrgId)
        .single();
      if (orgError) throw orgError;

      const ownerId = orgData.owner_id;

      const [bookingsRes, invoicesRes, profileRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, status, total_amount")
          .eq("org_id", currentOrgId)
          .eq("property_id", selectedPropertyId),
        supabase
          .from("invoices")
          .select("id, booking_id, status, total_amount, paid_amount, due_date")
          .eq("org_id", currentOrgId)
          .eq("property_id", selectedPropertyId),
        supabase.from("profiles").select("plan, plan_status, trial_expires_at").eq("id", ownerId).single(),
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (invoicesRes.error) throw invoicesRes.error;
      if (profileRes.error) throw profileRes.error;

      return {
        bookings: (bookingsRes.data ?? []) as BookingRow[],
        invoices: (invoicesRes.data ?? []) as InvoiceRow[],
        profile: profileRes.data as ProfileRow,
      };
    },
  });

  const summary = useMemo<RevenueAssuranceSummary>(() => {
    const bookings = data?.bookings ?? [];
    const invoices = data?.invoices ?? [];
    const profile = data?.profile;

    const now = Date.now();
    const bookedValue = bookings
      .filter((booking) => isBookedStatus(booking.status))
      .reduce((acc, booking) => acc + Number(booking.total_amount ?? 0), 0);
    const invoicedValue = invoices.reduce((acc, invoice) => acc + Number(invoice.total_amount ?? 0), 0);
    const paidValue = invoices.reduce((acc, invoice) => acc + Number(invoice.paid_amount ?? 0), 0);
    const outstandingValue = Math.max(0, invoicedValue - paidValue);
    const overdueInvoices = invoices.filter((invoice) => {
      if (!invoice.due_date) return false;
      if (invoice.status === "paid" || invoice.status === "cancelled") return false;
      return new Date(invoice.due_date).getTime() < now;
    }).length;

    const invoicesByBooking = new Map<string, InvoiceRow>();
    invoices.forEach((invoice) => {
      if (invoice.booking_id && !invoicesByBooking.has(invoice.booking_id)) {
        invoicesByBooking.set(invoice.booking_id, invoice);
      }
    });

    const bookingsWithoutInvoice = bookings.filter((booking) => isBookedStatus(booking.status) && !invoicesByBooking.has(booking.id)).length;
    const paidInvoicesWithoutBooking = invoices.filter((invoice) => invoice.status === "paid" && !invoice.booking_id).length;
    const checkedOutWithoutPaidInvoice = bookings.filter((booking) => {
      if (!isCheckedOutStatus(booking.status)) return false;
      const invoice = invoicesByBooking.get(booking.id);
      return !invoice || invoice.status !== "paid";
    }).length;

    const subscriptionSnapshot = deriveSubscriptionSnapshot({
      rawStatus: profile?.plan_status,
      trialExpiresAt: profile?.trial_expires_at,
      overdueInvoices,
      outstandingValue,
    });

    const leakageSignals: RevenueAssuranceSummary["leakageSignals"] = [];
    if (bookingsWithoutInvoice > 0) {
      leakageSignals.push({
        code: "BOOKING_WITHOUT_INVOICE",
        severity: "high",
        count: bookingsWithoutInvoice,
        description: "Reservas ativas sem invoice vinculado.",
      });
    }
    if (checkedOutWithoutPaidInvoice > 0) {
      leakageSignals.push({
        code: "CHECKOUT_WITHOUT_PAYMENT",
        severity: "high",
        count: checkedOutWithoutPaidInvoice,
        description: "Checkout concluido sem invoice pago.",
      });
    }
    if (paidInvoicesWithoutBooking > 0) {
      leakageSignals.push({
        code: "PAID_INVOICE_WITHOUT_BOOKING",
        severity: "medium",
        count: paidInvoicesWithoutBooking,
        description: "Invoice pago sem booking de referencia.",
      });
    }
    const outstandingRate = invoicedValue > 0 ? (outstandingValue / invoicedValue) * 100 : 0;
    if (outstandingRate >= 25) {
      leakageSignals.push({
        code: "HIGH_OUTSTANDING_RATE",
        severity: "medium",
        count: Number(outstandingRate.toFixed(1)),
        description: "Taxa de aberto acima do limite operacional (25%).",
      });
    }

    const goNoGoReasons: string[] = [];
    if (subscriptionSnapshot.effectiveStatus === "suspended" || subscriptionSnapshot.effectiveStatus === "cancelled") {
      goNoGoReasons.push(`Subscription em estado ${subscriptionSnapshot.effectiveStatus}.`);
    }
    if (bookingsWithoutInvoice > 0) {
      goNoGoReasons.push("Existem reservas sem invoice.");
    }
    if (checkedOutWithoutPaidInvoice > 0) {
      goNoGoReasons.push("Existem checkouts sem invoice pago.");
    }
    if (overdueInvoices >= 5) {
      goNoGoReasons.push("Fila de inadimplencia critica (>=5 invoices vencidos).");
    }

    return {
      subscription: {
        plan: String(profile?.plan ?? "free"),
        sourceStatus: subscriptionSnapshot.sourceStatus,
        effectiveStatus: subscriptionSnapshot.effectiveStatus,
      },
      totals: {
        bookedValue: Number(bookedValue.toFixed(2)),
        invoicedValue: Number(invoicedValue.toFixed(2)),
        paidValue: Number(paidValue.toFixed(2)),
        outstandingValue: Number(outstandingValue.toFixed(2)),
        overdueInvoices,
      },
      reconciliation: {
        bookingsWithoutInvoice,
        paidInvoicesWithoutBooking,
        checkedOutWithoutPaidInvoice,
        deltaBookedVsInvoiced: Number((bookedValue - invoicedValue).toFixed(2)),
        deltaInvoicedVsPaid: Number((invoicedValue - paidValue).toFixed(2)),
      },
      leakageSignals,
      goNoGo: {
        status: goNoGoReasons.length === 0 ? "GO" : "NO_GO",
        reasons: goNoGoReasons,
      },
    };
  }, [data?.bookings, data?.invoices, data?.profile]);

  return {
    summary,
    isLoading,
    error,
  };
};

