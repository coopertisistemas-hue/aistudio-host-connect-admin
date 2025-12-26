import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanType = 'free' | 'basic' | 'pro' | 'premium' | 'founder';

interface Entitlements {
    maxAccommodations: number;
    modules: {
        ecommerce: boolean;
        otas: boolean;
        gmb: boolean; // Google My Business
        site_bonus: boolean;
        ai_assistant: boolean;
        support: 'email' | 'chat' | 'priority';
    };
    isFounder: boolean;
    founderExpiresAt?: string | null;
}

const PLAN_LIMITS: Record<string, number> = {
    free: 1,
    basic: 2, // Start
    pro: 10,
    premium: 100,
    founder: 100
};

const MODULE_ACCESS: Record<string, Partial<Entitlements['modules']>> = {
    free: { ecommerce: false, otas: false, gmb: false, site_bonus: false, ai_assistant: false, support: 'email' },
    basic: { ecommerce: false, otas: true, gmb: false, site_bonus: false, ai_assistant: false, support: 'email' },
    pro: { ecommerce: false, otas: true, gmb: true, site_bonus: false, ai_assistant: true, support: 'chat' },
    premium: { ecommerce: true, otas: true, gmb: true, site_bonus: true, ai_assistant: true, support: 'priority' },
    founder: { ecommerce: true, otas: true, gmb: true, site_bonus: true, ai_assistant: true, support: 'priority' },
};

export const useEntitlements = () => {
    const { user } = useAuth();

    const queryFn = async () => {
        if (!user?.id) return null;
        const { data, error } = await supabase
            .from("profiles")
            .select("plan, accommodation_limit, founder_started_at, founder_expires_at, trial_started_at, trial_expires_at, plan_status")
            .eq("id", user.id)
            .single();

        if (error) throw error;
        return data;
    };

    const { data: profile, isLoading } = useQuery({
        queryKey: ["entitlements", user?.id],
        queryFn,
        enabled: !!user?.id,
    });

    let plan = (profile?.plan || 'free') as PlanType;
    const planStatus = profile?.plan_status || 'active';
    const trialExpiresAt = profile?.trial_expires_at;

    // Trial Calculation
    const now = new Date();
    const trialEndDate = trialExpiresAt ? new Date(trialExpiresAt) : null;

    // Check if in trial active period
    const isTrialActive = planStatus === 'trial' && trialEndDate && now <= trialEndDate;
    // Check if trial expired
    const isTrialExpired = planStatus === 'trial' && trialEndDate && now > trialEndDate;

    // Logic: Override plan if in active trial
    // User Requirement: "tratar como plano efetivo 'pro' (ou 'premium')" -> Using 'pro' to be safe, or 'premium' if we want full showcase.
    // The previous implementation used 'pro' in the prompt example, but 'premium' shows more features. 
    // Let's use 'premium' to let them taste everything (Founder is 'premium' + extra).
    // Actually adhering to prompt "tratar como plano efetivo 'pro' (ou 'premium' se definido)". 
    // Since 'plan' column in DB is likely empty or 'free' during trial, we force it here.
    if (isTrialActive) {
        plan = 'premium'; // Giving premium access during trial for full conversion potential
    } else if (isTrialExpired) {
        plan = 'free'; // Force downgrade logic if expired
    }

    const isFounder = plan === 'founder';

    // Use database limit if set, otherwise fallback to plan default
    const maxAccommodations = profile?.accommodation_limit || PLAN_LIMITS[plan] || 0;

    const modules = {
        ecommerce: false,
        otas: false,
        gmb: false,
        site_bonus: false,
        ai_assistant: false,
        support: 'email' as const,
        ...MODULE_ACCESS[plan]
    } as Entitlements['modules'];

    const canAccess = (moduleKey: keyof Entitlements['modules']) => {
        // If trial expired, strictly enforce limit even if modules are technically free? 
        // Actually MODULE_ACCESS['free'] already disables most things.
        // Special case: if expired, we might want to block even more? 
        // No, adhering to 'free' plan is enough for now.
        return modules[moduleKey];
    };

    const trialDaysLeft = trialEndDate ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
        plan,
        maxAccommodations,
        modules,
        canAccess,
        isFounder,
        founderExpiresAt: profile?.founder_expires_at,
        isLoading,
        // Trial Props
        isTrial: isTrialActive,
        isTrialExpired,
        trialExpiresAt,
        trialDaysLeft: Math.max(0, trialDaysLeft)
    };
};
