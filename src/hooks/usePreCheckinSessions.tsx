import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useOrg } from './useOrg';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type PreCheckinSession = Tables<'pre_checkin_sessions'>;
export type PreCheckinSessionInsert = TablesInsert<'pre_checkin_sessions'>;
export type PreCheckinSessionUpdate = TablesUpdate<'pre_checkin_sessions'>;

const generateToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const usePreCheckinSessions = (bookingId?: string) => {
    const queryClient = useQueryClient();
    const { currentOrgId, isLoading: isOrgLoading } = useOrg();

    const { data: sessions, isLoading, error } = useQuery({
        queryKey: ['pre_checkin_sessions', currentOrgId, bookingId],
        queryFn: async () => {
            if (!currentOrgId) throw new Error('Organization context required');

            let query = supabase
                .from('pre_checkin_sessions')
                .select('*')
                .eq('org_id', currentOrgId)
                .order('created_at', { ascending: false });

            if (bookingId) {
                query = query.eq('booking_id', bookingId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as PreCheckinSession[];
        },
        enabled: !!currentOrgId && !isOrgLoading,
    });

    const createSession = useMutation({
        mutationFn: async (bookingId: string) => {
            if (!currentOrgId) throw new Error('Organization context required');

            const token = generateToken();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

            const { data, error } = await supabase
                .from('pre_checkin_sessions')
                .insert({
                    org_id: currentOrgId,
                    booking_id: bookingId,
                    token,
                    expires_at: expiresAt.toISOString(),
                    status: 'pending',
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pre_checkin_sessions', currentOrgId] });
            toast({
                title: 'Sucesso',
                description: 'Link de pré-check-in gerado com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao gerar link de pré-check-in.',
                variant: 'destructive',
            });
        },
    });

    const finalizeSession = useMutation({
        mutationFn: async (sessionId: string) => {
            if (!currentOrgId) throw new Error('Organization context required');

            const { data, error } = await supabase
                .from('pre_checkin_sessions')
                .update({ status: 'completed' })
                .eq('id', sessionId)
                .eq('org_id', currentOrgId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pre_checkin_sessions', currentOrgId] });
            toast({
                title: 'Sucesso',
                description: 'Pré-check-in finalizado com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao finalizar pré-check-in.',
                variant: 'destructive',
            });
        },
    });

    const expireSession = useMutation({
        mutationFn: async (sessionId: string) => {
            if (!currentOrgId) throw new Error('Organization context required');

            const { data, error } = await supabase
                .from('pre_checkin_sessions')
                .update({ status: 'expired' })
                .eq('id', sessionId)
                .eq('org_id', currentOrgId)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pre_checkin_sessions', currentOrgId] });
            toast({
                title: 'Sucesso',
                description: 'Sessão expirada.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao expirar sessão.',
                variant: 'destructive',
            });
        },
    });

    return {
        sessions: sessions || [],
        isLoading: isLoading || isOrgLoading,
        error,
        createSession,
        finalizeSession,
        expireSession,
    };
};
