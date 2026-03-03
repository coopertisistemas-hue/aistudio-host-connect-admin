import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import { evaluateEntitlementAccess, type EntitlementDecision } from "@/lib/monetization/entitlementDecision";
import { deriveSubscriptionSnapshot } from "@/lib/monetization/subscriptionLifecycle";

export type PlanType = "free" | "basic" | "pro" | "premium" | "founder";

type ModuleFlag = "ecommerce" | "otas" | "gmb" | "site_bonus" | "ai_assistant" | "financial" | "tasks";
type SupportTier = "email" | "chat" | "priority";
type EntitlementModuleKey = ModuleFlag | "support" | (string & {});

interface Entitlements {
  maxAccommodations: number;
  modules: Record<ModuleFlag, boolean> & { support: SupportTier };
  isFounder: boolean;
  founderExpiresAt?: string | null;
}

type EntitlementQueryResult = {
  profile: {
    plan: string | null;
    accommodation_limit: number | null;
    founder_started_at: string | null;
    founder_expires_at: string | null;
    trial_started_at: string | null;
    trial_expires_at: string | null;
    plan_status: string | null;
  } | null;
  permissions: Record<string, boolean>;
};

const PLAN_LIMITS: Record<PlanType, number> = {
  free: 1,
  basic: 2,
  pro: 10,
  premium: 100,
  founder: 100,
};

const MODULE_ACCESS: Record<PlanType, Entitlements["modules"]> = {
  free: {
    ecommerce: false,
    otas: false,
    gmb: false,
    site_bonus: false,
    ai_assistant: false,
    support: "email",
    financial: false,
    tasks: true,
  },
  basic: {
    ecommerce: false,
    otas: true,
    gmb: false,
    site_bonus: false,
    ai_assistant: false,
    support: "email",
    financial: true,
    tasks: true,
  },
  pro: {
    ecommerce: false,
    otas: true,
    gmb: true,
    site_bonus: false,
    ai_assistant: true,
    support: "chat",
    financial: true,
    tasks: true,
  },
  premium: {
    ecommerce: true,
    otas: true,
    gmb: true,
    site_bonus: true,
    ai_assistant: true,
    support: "priority",
    financial: true,
    tasks: true,
  },
  founder: {
    ecommerce: true,
    otas: true,
    gmb: true,
    site_bonus: true,
    ai_assistant: true,
    support: "priority",
    financial: true,
    tasks: true,
  },
};

function normalizePlan(plan: string | null | undefined): PlanType {
  if (plan === "basic" || plan === "pro" || plan === "premium" || plan === "founder") {
    return plan;
  }
  return "free";
}

export const useEntitlements = () => {
  const { user } = useAuth();
  const { currentOrgId, role: orgRole, isLoading: isOrgLoading } = useOrg();

  const { data: entitlementsData, isLoading: isEntitlementsLoading } = useQuery({
    queryKey: ["entitlements_v3", user?.id, currentOrgId],
    enabled: !!user?.id && !isOrgLoading,
    queryFn: async (): Promise<EntitlementQueryResult | null> => {
      if (!user?.id) return null;

      let planOwnerId = user.id;

      if (currentOrgId) {
        const { data: org } = await supabase
          .from("organizations")
          .select("owner_id")
          .eq("id", currentOrgId)
          .single();
        if (org?.owner_id) {
          planOwnerId = org.owner_id;
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "plan, accommodation_limit, founder_started_at, founder_expires_at, trial_started_at, trial_expires_at, plan_status",
        )
        .eq("id", planOwnerId)
        .single();

      let permissions: Record<string, boolean> = {};
      if (currentOrgId) {
        const { data: perms } = await supabase
          .from("member_permissions")
          .select("module_key, can_read")
          .eq("org_id", currentOrgId)
          .eq("user_id", user.id);

        if (perms) {
          permissions = perms.reduce<Record<string, boolean>>((acc, permission) => {
            acc[permission.module_key] = permission.can_read ?? false;
            return acc;
          }, {});
        }
      }

      return {
        profile,
        permissions,
      };
    },
  });

  const entitlementState = useMemo(() => {
    const profile = entitlementsData?.profile;
    const userPermissions = entitlementsData?.permissions ?? {};

    let plan = normalizePlan(profile?.plan);
    const planStatus = profile?.plan_status ?? "active";
    const trialExpiresAt = profile?.trial_expires_at;

    const now = new Date();
    const trialEndDate = trialExpiresAt ? new Date(trialExpiresAt) : null;
    const subscriptionSnapshot = deriveSubscriptionSnapshot({
      rawStatus: planStatus,
      trialExpiresAt,
      overdueInvoices: 0,
      outstandingValue: 0,
    });
    const isTrialActive = subscriptionSnapshot.effectiveStatus === "trial";
    const isTrialExpired = subscriptionSnapshot.trialExpired;
    const isGrace = subscriptionSnapshot.effectiveStatus === "grace";
    const isSuspended = subscriptionSnapshot.effectiveStatus === "suspended";
    const isCancelled = subscriptionSnapshot.effectiveStatus === "cancelled";

    if (isTrialActive) {
      plan = "premium";
    } else if (isSuspended || isCancelled || isTrialExpired) {
      plan = "free";
    }

    const modules = MODULE_ACCESS[plan];
    const maxAccommodations = profile?.accommodation_limit ?? PLAN_LIMITS[plan];

    const checkAccess = (moduleKey: EntitlementModuleKey): EntitlementDecision => {
      const moduleValue = modules[moduleKey as keyof typeof modules];
      const planAllows = typeof moduleValue === "boolean" ? moduleValue : true;

      return evaluateEntitlementAccess({
        moduleKey,
        planAllows,
        role: orgRole,
        explicitPermission: userPermissions[moduleKey],
        plan,
      });
    };

    const canAccess = (moduleKey: EntitlementModuleKey): boolean => checkAccess(moduleKey) === "allowed";

    const trialDaysLeft = trialEndDate
      ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      plan,
      maxAccommodations,
      modules,
      canAccess,
      checkAccess,
      isFounder: plan === "founder",
      founderExpiresAt: profile?.founder_expires_at,
      isTrial: isTrialActive,
      isTrialExpired,
      trialExpiresAt,
      trialDaysLeft: Math.max(0, trialDaysLeft),
      role: orgRole,
      sourceSubscriptionStatus: subscriptionSnapshot.sourceStatus,
      subscriptionStatus: subscriptionSnapshot.effectiveStatus,
      isGrace,
      isSuspended,
      isCancelled,
    };
  }, [entitlementsData?.permissions, entitlementsData?.profile, orgRole]);

  return {
    ...entitlementState,
    isLoading: isEntitlementsLoading || isOrgLoading,
  };
};
