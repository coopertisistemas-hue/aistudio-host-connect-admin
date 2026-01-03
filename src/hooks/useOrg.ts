
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface Organization {
    id: string;
    name: string;
    role: string;
}

export const useOrg = () => {
    const { user, loading: authLoading } = useAuth();

    const { data: org, isLoading, error } = useQuery<Organization | null>({
        queryKey: ["organization", user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            console.log("[useOrg] Iniciando consulta (limite 3s)...");

            const queryPromise = (async () => {
                try {
                    const { data: member, error: memError } = await supabase
                        .from("org_members")
                        .select("role, org_id")
                        .eq("user_id", user.id)
                        .maybeSingle();

                    if (memError || !member) return null;

                    const { data: orgData, error: orgError } = await supabase
                        .from("organizations")
                        .select("id, name")
                        .eq("id", member.org_id)
                        .maybeSingle();

                    if (orgError || !orgData) return null;

                    return {
                        id: orgData.id,
                        name: orgData.name,
                        role: member.role
                    } as Organization;
                } catch (err) {
                    console.error("[useOrg] Erro interno:", err);
                    return null;
                }
            })();

            // Garantia absoluta de que a query resolve em 3.5s
            const timeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => {
                    console.warn("[useOrg] Timeout atingido, liberando UI.");
                    resolve(null);
                }, 3500)
            );

            return Promise.race([queryPromise, timeoutPromise]);
        },
        enabled: !!user?.id && !authLoading,
        staleTime: 1000 * 60 * 60,
        retry: false,
    });

    const finalLoading = (isLoading || authLoading) && !!user?.id;
    const [forceReady, setForceReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (finalLoading) {
                console.warn('[useOrg] Force-Ready triggered after 4s hang.');
                setForceReady(true);
            }
        }, 4000);
        return () => clearTimeout(timer);
    }, [finalLoading]);

    const isActuallyLoading = finalLoading && !forceReady;

    console.log('[useOrg] Render State:', {
        hasUser: !!user?.id,
        authLoading,
        isQueryLoading: isLoading,
        isActuallyLoading,
        hasOrg: !!org
    });

    return {
        org: org || null,
        currentOrgId: org?.id,
        role: org?.role,
        isLoading: isActuallyLoading,
        isAuthLoading: authLoading,
        isQueryLoading: isLoading,
        error
    };
};
