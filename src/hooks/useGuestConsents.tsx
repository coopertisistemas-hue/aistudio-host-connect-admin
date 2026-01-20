import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useOrg } from './useOrg';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type GuestConsent = Tables<'guest_consents'>;
export type GuestConsentInsert = TablesInsert<'guest_consents'>;

export const useGuestConsents = (guestId: string | undefined) => {
    const queryClient = useQueryClient();
    const { currentOrgId, isLoading: isOrgLoading } = useOrg();

    const { data: consents, isLoading, error } = useQuery({
        queryKey: ['guest_consents', currentOrgId, guestId],
        queryFn: async () => {
            if (!currentOrgId) throw new Error('Organization context required');
            if (!guestId) throw new Error('Guest ID required');

            const { data, error } = await supabase
                .from('guest_consents')
                .select('*')
                .eq('org_id', currentOrgId)
                .eq('guest_id', guestId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as GuestConsent[];
        },
        enabled: !!currentOrgId && !!guestId && !isOrgLoading,
    });

    const createConsent = useMutation({
        mutationFn: async (consent: Omit<GuestConsentInsert, 'org_id' | 'guest_id'>) => {
            if (!currentOrgId) throw new Error('Organization context required');
            if (!guestId) throw new Error('Guest ID required');

            const { data, error } = await supabase
                .from('guest_consents')
                .insert({
                    ...consent,
                    org_id: currentOrgId,
                    guest_id: guestId,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['guest_consents', currentOrgId, guestId] });
            toast({
                title: 'Sucesso',
                description: 'Consentimento registrado com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao registrar consentimento.',
                variant: 'destructive',
            });
        },
    });

    return {
        consents: consents || [],
        isLoading: isLoading || isOrgLoading,
        error,
        createConsent,
    };
};
