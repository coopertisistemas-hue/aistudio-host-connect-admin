import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import {
  type SubscriptionEvent,
  type SubscriptionStatus,
  canTransitionSubscriptionStatus,
  deriveSubscriptionSnapshot,
  getAllowedSubscriptionTransitions,
} from "@/lib/monetization/subscriptionLifecycle";

type LifecycleProfile = {
  id: string;
  plan: string | null;
  plan_status: string | null;
  trial_expires_at: string | null;
};

type LifecycleInvoice = {
  total_amount: number | null;
  paid_amount: number | null;
  status: "pending" | "paid" | "partially_paid" | "cancelled";
  due_date: string | null;
};

export const useSubscriptionLifecycle = () => {
  const { currentOrgId } = useOrg();

  const { data, isLoading, error } = useQuery({
    queryKey: ["subscription-lifecycle", currentOrgId],
    enabled: !!currentOrgId,
    queryFn: async () => {
      if (!currentOrgId) return null;

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("owner_id")
        .eq("id", currentOrgId)
        .single();
      if (orgError) throw orgError;

      const ownerId = orgData.owner_id;

      const [profileRes, invoicesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, plan, plan_status, trial_expires_at")
          .eq("id", ownerId)
          .single(),
        supabase.from("invoices").select("total_amount, paid_amount, status, due_date").eq("org_id", currentOrgId),
      ]);

      if (profileRes.error) throw profileRes.error;
      if (invoicesRes.error) throw invoicesRes.error;

      return {
        profile: profileRes.data as LifecycleProfile,
        invoices: (invoicesRes.data ?? []) as LifecycleInvoice[],
      };
    },
  });

  const summary = useMemo(() => {
    if (!data) {
      return {
        plan: "free",
        sourceStatus: "active",
        effectiveStatus: "active",
        trialExpiresAt: null as string | null,
        trialExpired: false,
        overdueInvoices: 0,
        outstandingValue: 0,
        allowedTransitions: [] as Array<{ event: string; nextStatus: string }>,
        invalidTransitions: [] as Array<{ from: string; event: string; to: string }>,
      };
    }

    const now = new Date();
    const overdueInvoices = data.invoices.filter((invoice) => {
      if (!invoice.due_date) return false;
      if (invoice.status === "paid" || invoice.status === "cancelled") return false;
      return new Date(invoice.due_date).getTime() < now.getTime();
    }).length;

    const invoicedValue = data.invoices.reduce((acc, invoice) => acc + Number(invoice.total_amount ?? 0), 0);
    const paidValue = data.invoices.reduce((acc, invoice) => acc + Number(invoice.paid_amount ?? 0), 0);
    const outstandingValue = Math.max(0, invoicedValue - paidValue);

    const snapshot = deriveSubscriptionSnapshot({
      rawStatus: data.profile.plan_status,
      trialExpiresAt: data.profile.trial_expires_at,
      overdueInvoices,
      outstandingValue,
    });

    const allowedTransitions = getAllowedSubscriptionTransitions(snapshot.effectiveStatus);

    const invalidTransitions: Array<{ from: SubscriptionStatus; event: SubscriptionEvent; to: SubscriptionStatus }> = [
      { from: "cancelled", event: "payment_succeeded", to: "active" },
      { from: "suspended", event: "trial_started", to: "trial" },
      { from: "active", event: "trial_started", to: "trial" },
    ].filter(
      (transition) =>
        !canTransitionSubscriptionStatus({
          from: transition.from,
          event: transition.event,
          to: transition.to,
        }),
    );

    return {
      plan: String(data.profile.plan ?? "free"),
      sourceStatus: snapshot.sourceStatus,
      effectiveStatus: snapshot.effectiveStatus,
      trialExpiresAt: data.profile.trial_expires_at,
      trialExpired: snapshot.trialExpired,
      overdueInvoices,
      outstandingValue: Number(outstandingValue.toFixed(2)),
      allowedTransitions,
      invalidTransitions,
    };
  }, [data]);

  return {
    summary,
    isLoading,
    error,
  };
};
