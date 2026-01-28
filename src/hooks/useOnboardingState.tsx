import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/hooks/useOrg';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export type OnboardingMode = 'simple' | 'standard' | 'hotel' | null;

export interface OnboardingState {
    id: string;
    org_id: string;
    property_id: string | null;
    mode: OnboardingMode;
    last_step: number;
    completed_at: string | null;
    dismissed_at: string | null;
    created_at: string;
    updated_at: string;
}

export const useOnboardingState = () => {
    const { currentOrgId, isLoading: isOrgLoading } = useOrg();
    const queryClient = useQueryClient();

    const { data: onboarding, isLoading, error } = useQuery({
        queryKey: ['onboarding', currentOrgId],
        queryFn: async () => {
            if (!currentOrgId) {
                console.warn('[useOnboardingState] No currentOrgId');
                return null;
            }

            // Try to fetch existing onboarding record
            const { data: existing, error: fetchError } = await supabase
                .from('hostconnect_onboarding')
                .select('*')
                .eq('org_id', currentOrgId)
                .maybeSingle();

            if (fetchError) {
                console.error('[useOnboardingState] Fetch error:', fetchError);
                throw fetchError;
            }

            // If exists, return it
            if (existing) {
                return existing as OnboardingState;
            }

            // Otherwise, create a new onboarding record
            const { data: created, error: createError } = await supabase
                .from('hostconnect_onboarding')
                .insert({
                    org_id: currentOrgId,
                    last_step: 1,
                })
                .select()
                .single();

            if (createError) {
                console.error('[useOnboardingState] Create error:', createError);
                throw createError;
            }

            return created as OnboardingState;
        },
        enabled: !!currentOrgId && !isOrgLoading,
    });

    return {
        onboarding,
        isLoading: isLoading || isOrgLoading,
        error,
    };
};

export const useUpdateOnboarding = () => {
    const { currentOrgId } = useOrg();
    const { userRole } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: Partial<Pick<OnboardingState, 'mode' | 'last_step' | 'property_id' | 'completed_at' | 'dismissed_at'>>) => {
            if (!currentOrgId) {
                throw new Error('Org ID não disponível');
            }

            // Viewer guard
            if (userRole === 'viewer') {
                throw new Error('Visualizadores não podem modificar configurações');
            }

            const { data, error } = await supabase
                .from('hostconnect_onboarding')
                .update(updates)
                .eq('org_id', currentOrgId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding', currentOrgId] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro ao atualizar configuração',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
};
