import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";

type OwnerProfile = {
  plan: string | null;
  plan_status: string | null;
  trial_expires_at: string | null;
  accommodation_limit: number | null;
};

type OrgMember = {
  user_id: string;
};

type MemberProfile = {
  id: string;
  plan: string | null;
};

type InvoiceRow = {
  id: string;
  total_amount: number | null;
  paid_amount: number | null;
  status: "pending" | "paid" | "partially_paid" | "cancelled";
  due_date: string | null;
  created_at: string;
};

type PropertyRow = {
  id: string;
  status: string;
};

export type MonetizationConsoleSummary = {
  kpis: {
    mrrBaseline: number;
    invoicedValue: number;
    paidValue: number;
    outstandingValue: number;
    delinquencyRate: number;
  };
  risk: {
    overdueInvoices: number;
    trialDaysRemaining: number | null;
    churnRiskScore: number;
  };
  opportunity: {
    activeProperties: number;
    accommodationLimit: number;
    occupancyLimitRatio: number;
    upgradeRecommended: boolean;
  };
  planMix: Array<{ plan: string; count: number }>;
  billingTimeline: Array<{ month: string; paid: number; invoiced: number }>;
};

const PLAN_PRICE_FALLBACK: Record<string, number> = {
  free: 0,
  basic: 149,
  pro: 349,
  premium: 699,
  founder: 0,
};

function toMonthKey(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

export const useMonetizationConsole = () => {
  const { currentOrgId } = useOrg();

  const { data, isLoading, error } = useQuery({
    queryKey: ["monetization-console", currentOrgId],
    enabled: !!currentOrgId,
    queryFn: async () => {
      if (!currentOrgId) {
        return {
          ownerProfile: null as OwnerProfile | null,
          memberProfiles: [] as MemberProfile[],
          invoices: [] as InvoiceRow[],
          properties: [] as PropertyRow[],
          pricingPlans: [] as Array<{ name: string; price: number }>,
        };
      }

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("owner_id")
        .eq("id", currentOrgId)
        .single();
      if (orgError) throw orgError;

      const ownerId = orgData.owner_id;

      const [ownerProfileRes, membersRes, invoicesRes, propertiesRes, plansRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("plan, plan_status, trial_expires_at, accommodation_limit")
          .eq("id", ownerId)
          .single(),
        supabase.from("org_members").select("user_id").eq("org_id", currentOrgId),
        supabase
          .from("invoices")
          .select("id, total_amount, paid_amount, status, due_date, created_at")
          .eq("org_id", currentOrgId),
        supabase.from("properties").select("id, status").eq("org_id", currentOrgId),
        supabase.from("pricing_plans").select("name, price"),
      ]);

      if (ownerProfileRes.error) throw ownerProfileRes.error;
      if (membersRes.error) throw membersRes.error;
      if (invoicesRes.error) throw invoicesRes.error;
      if (propertiesRes.error) throw propertiesRes.error;
      if (plansRes.error) throw plansRes.error;

      const memberIds = (membersRes.data ?? []).map((member: OrgMember) => member.user_id);
      let memberProfiles: MemberProfile[] = [];
      if (memberIds.length > 0) {
        const { data: memberProfilesData, error: memberProfilesError } = await supabase
          .from("profiles")
          .select("id, plan")
          .in("id", memberIds);
        if (memberProfilesError) throw memberProfilesError;
        memberProfiles = (memberProfilesData ?? []) as MemberProfile[];
      }

      return {
        ownerProfile: ownerProfileRes.data as OwnerProfile,
        memberProfiles,
        invoices: (invoicesRes.data ?? []) as InvoiceRow[],
        properties: (propertiesRes.data ?? []) as PropertyRow[],
        pricingPlans: (plansRes.data ?? []) as Array<{ name: string; price: number }>,
      };
    },
  });

  const summary = useMemo<MonetizationConsoleSummary>(() => {
    const ownerProfile = data?.ownerProfile;
    const invoices = data?.invoices ?? [];
    const properties = data?.properties ?? [];
    const memberProfiles = data?.memberProfiles ?? [];
    const pricingPlans = data?.pricingPlans ?? [];

    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const overdueInvoices = invoices.filter((invoice) => {
      if (!invoice.due_date) return false;
      if (invoice.status === "paid" || invoice.status === "cancelled") return false;
      return new Date(invoice.due_date).getTime() < now.getTime();
    }).length;

    const invoicedValue = invoices.reduce((acc, invoice) => acc + Number(invoice.total_amount ?? 0), 0);
    const paidValue = invoices.reduce((acc, invoice) => acc + Number(invoice.paid_amount ?? 0), 0);
    const outstandingValue = Math.max(0, invoicedValue - paidValue);
    const delinquencyRate = invoicedValue > 0 ? (outstandingValue / invoicedValue) * 100 : 0;

    const paidLast30Days = invoices
      .filter((invoice) => new Date(invoice.created_at).getTime() >= lastMonthStart.getTime())
      .reduce((acc, invoice) => acc + Number(invoice.paid_amount ?? 0), 0);

    const ownerPlan = String(ownerProfile?.plan ?? "free").toLowerCase();
    const matchedPlan =
      pricingPlans.find((plan) => plan.name.toLowerCase().includes(ownerPlan)) ??
      pricingPlans.find((plan) => ownerPlan.includes(plan.name.toLowerCase()));
    const planPrice = matchedPlan ? Number(matchedPlan.price) : PLAN_PRICE_FALLBACK[ownerPlan] ?? 0;
    const mrrBaseline = Math.max(planPrice, paidLast30Days);

    const activeProperties = properties.filter((property) => property.status === "active").length;
    const accommodationLimit = ownerProfile?.accommodation_limit ?? 1;
    const occupancyLimitRatio = accommodationLimit > 0 ? (activeProperties / accommodationLimit) * 100 : 0;
    const upgradeRecommended =
      ownerPlan !== "premium" &&
      ownerPlan !== "founder" &&
      (occupancyLimitRatio >= 80 || overdueInvoices >= 3);

    const trialDaysRemaining = ownerProfile?.trial_expires_at
      ? Math.ceil((new Date(ownerProfile.trial_expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const churnRiskScore = Math.min(
      100,
      Math.max(
        0,
        overdueInvoices * 15 +
          (delinquencyRate > 0 ? Math.round(delinquencyRate / 2) : 0) +
          (trialDaysRemaining !== null && trialDaysRemaining <= 5 ? 25 : 0),
      ),
    );

    const planMixMap = new Map<string, number>();
    memberProfiles.forEach((profile) => {
      const plan = String(profile.plan ?? "free").toLowerCase();
      planMixMap.set(plan, (planMixMap.get(plan) ?? 0) + 1);
    });

    if (!planMixMap.size) {
      planMixMap.set(ownerPlan, 1);
    }

    const planMix = Array.from(planMixMap.entries())
      .map(([plan, count]) => ({ plan, count }))
      .sort((a, b) => b.count - a.count);

    const timelineMap = new Map<string, { paid: number; invoiced: number }>();
    invoices.forEach((invoice) => {
      const key = toMonthKey(new Date(invoice.created_at));
      const current = timelineMap.get(key) ?? { paid: 0, invoiced: 0 };
      current.paid += Number(invoice.paid_amount ?? 0);
      current.invoiced += Number(invoice.total_amount ?? 0);
      timelineMap.set(key, current);
    });

    const billingTimeline = Array.from(timelineMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, values]) => ({
        month,
        paid: Number(values.paid.toFixed(2)),
        invoiced: Number(values.invoiced.toFixed(2)),
      }));

    return {
      kpis: {
        mrrBaseline: Number(mrrBaseline.toFixed(2)),
        invoicedValue: Number(invoicedValue.toFixed(2)),
        paidValue: Number(paidValue.toFixed(2)),
        outstandingValue: Number(outstandingValue.toFixed(2)),
        delinquencyRate: Number(delinquencyRate.toFixed(1)),
      },
      risk: {
        overdueInvoices,
        trialDaysRemaining,
        churnRiskScore,
      },
      opportunity: {
        activeProperties,
        accommodationLimit,
        occupancyLimitRatio: Number(occupancyLimitRatio.toFixed(1)),
        upgradeRecommended,
      },
      planMix,
      billingTimeline,
    };
  }, [data]);

  return {
    summary,
    isLoading,
    error,
  };
};

