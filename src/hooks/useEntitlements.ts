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

    const { data: profile, isLoading } = useQuery({
        queryKey: ["entitlements", user?.id],
        queryFn: async () => {
            if (!user?.id) return null;
            const { data, error } = await supabase
                .from("profiles")
                .select("plan, accommodation_limit, founder_started_at, founder_expires_at")
                .eq("id", user.id)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!user?.id,
    });

    const plan = (profile?.plan || 'free') as PlanType;
    const isFounder = plan === 'founder';

    // Use database limit if set, otherwise fallback to plan default
    const maxAccommodations = profile?.accommodation_limit || PLAN_LIMITS[plan] || 0;

    const modules = {
        ecommerce: false,
        otas: false,
        gmb: false,
        site_bonus: false,
        ai_assistant: false,
        support: 'email',
        ...MODULE_ACCESS[plan]
    } as Entitlements['modules'];

    const canAccess = (moduleKey: keyof Entitlements['modules']) => {
        return modules[moduleKey];
    };

    return {
        plan,
        maxAccommodations,
        modules,
        canAccess,
        isFounder,
        founderExpiresAt: profile?.founder_expires_at,
        isLoading
    };
};
