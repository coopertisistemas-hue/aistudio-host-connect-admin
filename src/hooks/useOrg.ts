
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface Organization {
    id: string;
    name: string;
    role: string;
}

export const useOrg = () => {
    const { user } = useAuth();

    const { data: org, isLoading } = useQuery({
        queryKey: ["organization", user?.id],
        queryFn: async () => {
            if (!user?.id) return null;

            // Fetch the first organization member record
            // We order by created_at to get the "default" (first created) one.
            // In the future, this could be stored in local storage or user preferences for switching.
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
                // If no rows, returns null logic handled by maybeSingle() usually, but .single() throws.
                // If the user has no org (shouldn't happen with bootstrap), handle gracefully.
                if (error.code === 'PGRST116') return null; // No rows found
                throw error;
            }

            if (!data || !data.organizations) return null;

            // Flatten structure
            // Typescript needs casting usually because joined data can be array or single depending on structure,
            // but here organizations is a single relation FK.
            // But Supabase types generated might say it's an array or object.
            // Assuming 1-1 mapping in response due to structure.
            const orgData = data.organizations as unknown as { id: string, name: string };

            return {
                id: orgData.id,
                name: orgData.name,
                role: data.role
            } as Organization;
        },
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5, // Cache for 5 mins
    });

    return {
        org,
        currentOrgId: org?.id,
        role: org?.role,
        isLoading
    };
};
