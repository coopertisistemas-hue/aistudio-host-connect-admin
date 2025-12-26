import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";

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
        financial: boolean; // Added
        tasks: boolean; // Added
        // Add other keys as needed matching module_key in DB
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
    free: { ecommerce: false, otas: false, gmb: false, site_bonus: false, ai_assistant: false, support: 'email', financial: false, tasks: true },
    basic: { ecommerce: false, otas: true, gmb: false, site_bonus: false, ai_assistant: false, support: 'email', financial: true, tasks: true },
    pro: { ecommerce: false, otas: true, gmb: true, site_bonus: false, ai_assistant: true, support: 'chat', financial: true, tasks: true },
    premium: { ecommerce: true, otas: true, gmb: true, site_bonus: true, ai_assistant: true, support: 'priority', financial: true, tasks: true },
    founder: { ecommerce: true, otas: true, gmb: true, site_bonus: true, ai_assistant: true, support: 'priority', financial: true, tasks: true },
};

export const useEntitlements = () => {
    const { user } = useAuth();
    const { currentOrgId, role: orgRole, isLoading: isOrgLoading } = useOrg();

    const { data: entitlementsData, isLoading: isEntitlementsLoading } = useQuery({
        queryKey: ["entitlements_v2", user?.id, currentOrgId], // v2 to bust cache
        queryFn: async () => {
            if (!user?.id) return null;

            let planOwnerId = user.id;

            // 1. If in an Org, determine the Owner to get THEIR plan
            if (currentOrgId) {
                const { data: org } = await supabase.from('organizations').select('owner_id').eq('id', currentOrgId).single();
                if (org && org.owner_id) {
                    planOwnerId = org.owner_id;
                }
            }

            // 2. Fetch Plan (from Owner)
            const { data: profile } = await supabase
                .from("profiles")
                .select("plan, accommodation_limit, founder_started_at, founder_expires_at, trial_started_at, trial_expires_at, plan_status")
                .eq("id", planOwnerId)
                .single();

            // 3. Fetch Permissions (for Current User in Current Org)
            let permissions: Record<string, boolean> = {};
            if (currentOrgId) {
                const { data: perms } = await supabase
                    .from('member_permissions')
                    .select('module_key, can_read')
                    .eq('org_id', currentOrgId)
                    .eq('user_id', user.id);

                if (perms) {
                    perms.forEach(p => {
                        permissions[p.module_key] = p.can_read || false;
                    });
                }
            }

            return { profile, permissions };
        },
        enabled: !!user?.id && !isOrgLoading,
    });

    const profile = entitlementsData?.profile;
    const userPermissions = entitlementsData?.permissions || {};

    let plan = (profile?.plan || 'free') as PlanType;
    const planStatus = profile?.plan_status || 'active';
    const trialExpiresAt = profile?.trial_expires_at;

    // Trial Calculation
    const now = new Date();
    const trialEndDate = trialExpiresAt ? new Date(trialExpiresAt) : null;
    const isTrialActive = planStatus === 'trial' && trialEndDate && now <= trialEndDate;
    const isTrialExpired = planStatus === 'trial' && trialEndDate && now > trialEndDate;

    if (isTrialActive) {
        plan = 'premium';
    } else if (isTrialExpired) {
        plan = 'free';
    }

    const isFounder = plan === 'founder';
    const maxAccommodations = profile?.accommodation_limit || PLAN_LIMITS[plan] || 0;

    const modules = {
        ecommerce: false,
        otas: false,
        gmb: false,
        site_bonus: false,
        ai_assistant: false,
        financial: false,
        tasks: false,
        support: 'email' as const,
        ...MODULE_ACCESS[plan]
    } as Entitlements['modules'];

    // Access Check Function
    const canAccess = (moduleKey: keyof Entitlements['modules'] | string) => {
        // 1. Plan Check
        // If moduleKey represents a feature flagged in PLAN, check it.
        // Some keys might not be in the 'modules' object explicitly (dynamic), so we check if key exists.
        const planAllows = (modules as any)[moduleKey] !== false; // boolean true or undefined (assumed allowed if not explicit false in plan? No, explicit whitelist usually).
        // Actually MODULE_ACCESS defaults are explicit.

        // Let's rely on MODULE_ACCESS being the truth for Plan.
        // If 'financial' is in MODULE_ACCESS, check it.
        const moduleValueInPlan = (modules as any)[moduleKey];
        const isPlanAllowed = moduleValueInPlan === true || moduleValueInPlan === undefined ? false : moduleValueInPlan;
        // Wait, 'support' is string. boolean check needs care.
        // Simplified:
        let accessByPlan = (modules as any)[moduleKey];
        if (typeof accessByPlan !== 'boolean') accessByPlan = true; // For 'support' string, it "allows" access implies existence. But 'support' is distinct.
        // Let's stick to boolean modules for permissions.

        if (accessByPlan === false) return 'upgrade_required'; // PLAN BLOCK

        // 2. User Permission Check (Role Based)
        // Owner / Admin / Manager -> Full Access (bypass permission table?)
        // Let's say Owner/Admin has implicit full access.
        if (orgRole === 'owner' || orgRole === 'admin') return true;

        // 3. Explicit Permission Table
        // If row exists, use it. If not, default to...? 
        // Prompt requirement: "se plano permite mas user não".
        // This implies explicit deny or default deny?
        // Let's assume Default Allow for 'member' EXCEPT if explicitly denied in DB?
        // OR Default Deny? 
        // Usually Default Allow for core features is friendlier, but 'Permissions' implies limiting.
        // Let's look at the migration: "can_read DEFAULT true".
        // So if a row exists, it defaults to true.
        // If NO row exists?
        // Let's assume if NO row exists, they HAVE access (unless we want to force configuring every permission).
        // Let's return true if no entry found.

        if (userPermissions[moduleKey] === false) return 'permission_denied'; // Explicitly set to false

        return true;
    };

    // Helper to distinguish "Unlock Feature" vs "Ask Admin"
    // Return types: true (allowed), 'upgrade_required' (plan), 'permission_denied' (user)

    const trialDaysLeft = trialEndDate ? Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
        plan,
        maxAccommodations,
        modules,
        canAccess,
        checkAccess: canAccess, // Alias for clear naming
        isFounder,
        founderExpiresAt: profile?.founder_expires_at,
        isLoading: isEntitlementsLoading || isOrgLoading,
        isTrial: isTrialActive,
        isTrialExpired,
        trialExpiresAt,
        trialDaysLeft: Math.max(0, trialDaysLeft),
        role: orgRole
    };
};
