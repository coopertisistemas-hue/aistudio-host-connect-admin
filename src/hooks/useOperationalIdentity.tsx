import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProperties } from './useProperties';

export interface OperationalIdentity {
    client_logo_url: string | null;
    client_short_name: string;
    staff_short_name: string;
}

/**
 * Hook to fetch operational identity for the mobile hero section.
 * Includes robust fallback logic to local data if the edge function fails.
 */
export const useOperationalIdentity = (propertyId: string | null) => {
    const { user } = useAuth();
    const { properties } = useProperties();

    // 1. Prepare local fallback data from existing hooks
    const selectedProperty = properties.find(p => p.id === propertyId);
    const userFullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Colaborador";

    // Rule: "Urubici Park Hotel" -> "Urubici Park", "Casa do Vinho" -> "Casa do Vinho"
    const propertyWords = (selectedProperty?.name || "Operações").split(' ');
    let fallbackClientName = propertyWords[0];

    if (propertyWords.length > 1) {
        const p2 = propertyWords[1].toLowerCase();
        const prepositions = ['de', 'do', 'da', 'di', 'dos', 'das'];

        if (prepositions.includes(p2) && propertyWords.length > 2) {
            fallbackClientName = `${propertyWords[0]} ${propertyWords[1]} ${propertyWords[2]}`;
        } else if (propertyWords[1].length > 2) {
            fallbackClientName = `${propertyWords[0]} ${propertyWords[1]}`;
        }
    }

    // Rule: "Alexandre S.", "Maria L."
    const nameParts = userFullName.split(' ');
    const fallbackStaffName = nameParts.length > 1
        ? `${nameParts[0]} ${nameParts[1][0]}.`
        : nameParts[0];

    return useQuery<OperationalIdentity, Error>({
        queryKey: ['operational-identity', propertyId, user?.id],
        queryFn: async () => {
            try {
                const { data, error } = await supabase.functions.invoke('get-operational-identity', {
                    body: JSON.stringify({ property_id: propertyId }),
                });

                // If the function doesn't exist or returns an error, we return the fallback object
                // but we still want the query to be considered "success" in terms of UI rendering
                if (error) {
                    console.warn('[OperationalIdentity] Edge function error, using local fallback:', error);
                    return {
                        client_logo_url: null,
                        client_short_name: fallbackClientName,
                        staff_short_name: fallbackStaffName,
                    };
                }

                return {
                    client_logo_url: data?.client_logo_url || null,
                    client_short_name: data?.client_short_name || fallbackClientName,
                    staff_short_name: data?.staff_short_name || fallbackStaffName,
                };
            } catch (err) {
                console.warn('[OperationalIdentity] Fetch failed, using fallback:', err);
                return {
                    client_logo_url: null,
                    client_short_name: fallbackClientName,
                    staff_short_name: fallbackStaffName,
                };
            }
        },
        enabled: !!propertyId && !!user,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
        gcTime: 1000 * 60 * 30,    // 30 minutes garbage collection
        // Ensure we always have data even on initial load failure if possible
        initialData: {
            client_logo_url: null,
            client_short_name: fallbackClientName,
            staff_short_name: fallbackStaffName,
        },
    });
};
