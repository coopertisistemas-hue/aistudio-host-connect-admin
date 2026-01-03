
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

    const { data: org, isLoading } = useQuery({
        queryKey: ["organization", user?.id],
        queryFn: async () => {
            if (!user?.id) {
                console.log("[useOrg] No user ID, skipping fetch");
                return null;
            }
            console.log("[useOrg] Fetching org for user:", user.id);

            const { data, error } = await supabase
                .from("org_members")
                .select(`
          role,
          organizations (
            id,
            name
          )
        `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: true })
                .limit(1)
                .single();

            if (error) {
                console.error("[useOrg] Error:", error);
                return null;
            }

            if (!data || !data.organizations) {
                console.log("[useOrg] No org found");
                return null;
            }

            const orgData = data.organizations as unknown as { id: string, name: string };
            console.log("[useOrg] Org loaded:", orgData.name);

            return {
                id: orgData.id,
                name: orgData.name,
                role: data.role
            } as Organization;
        },
        enabled: !!user?.id && !authLoading,
        staleTime: 1000 * 60 * 5,
        retry: false,
    });

    return {
        org,
        currentOrgId: org?.id,
        role: org?.role,
        isLoading
    };
};
