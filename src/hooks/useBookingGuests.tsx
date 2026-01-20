import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useOrg } from './useOrg';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export type BookingGuest = Tables<'booking_guests'>;
export type BookingGuestInsert = TablesInsert<'booking_guests'>;

export const useBookingGuests = (bookingId: string | undefined) => {
    const queryClient = useQueryClient();
    const { currentOrgId, isLoading: isOrgLoading } = useOrg();

    const { data: participants, isLoading, error } = useQuery({
        queryKey: ['booking_guests', currentOrgId, bookingId],
        queryFn: async () => {
            if (!currentOrgId) throw new Error('Organization context required');
            if (!bookingId) throw new Error('Booking ID required');

            const { data, error } = await supabase
                .from('booking_guests')
                .select(`
          *,
          guests (
            id,
            first_name,
            last_name,
            email,
            document,
            phone
          )
        `)
                .eq('org_id', currentOrgId)
                .eq('booking_id', bookingId)
                .order('is_primary', { ascending: false })
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as (BookingGuest & { guests?: any })[];
        },
        enabled: !!currentOrgId && !!bookingId && !isOrgLoading,
    });

    const addParticipant = useMutation({
        mutationFn: async (participant: Omit<BookingGuestInsert, 'org_id' | 'booking_id'>) => {
            if (!currentOrgId) throw new Error('Organization context required');
            if (!bookingId) throw new Error('Booking ID required');

            const { data, error } = await supabase
                .from('booking_guests')
                .insert({
                    ...participant,
                    org_id: currentOrgId,
                    booking_id: bookingId,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking_guests', currentOrgId, bookingId] });
            toast({
                title: 'Sucesso',
                description: 'Participante adicionado com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao adicionar participante.',
                variant: 'destructive',
            });
        },
    });

    const removeParticipant = useMutation({
        mutationFn: async (participantId: string) => {
            if (!currentOrgId) throw new Error('Organization context required');

            const { error } = await supabase
                .from('booking_guests')
                .delete()
                .eq('id', participantId)
                .eq('org_id', currentOrgId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking_guests', currentOrgId, bookingId] });
            toast({
                title: 'Sucesso',
                description: 'Participante removido com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao remover participante.',
                variant: 'destructive',
            });
        },
    });

    const setPrimaryParticipant = useMutation({
        mutationFn: async (participantId: string) => {
            if (!currentOrgId) throw new Error('Organization context required');
            if (!bookingId) throw new Error('Booking ID required');

            // First, unset all as primary
            const { error: unsetError } = await supabase
                .from('booking_guests')
                .update({ is_primary: false })
                .eq('booking_id', bookingId)
                .eq('org_id', currentOrgId);

            if (unsetError) throw unsetError;

            // Then, set the selected one as primary
            const { error: setError } = await supabase
                .from('booking_guests')
                .update({ is_primary: true })
                .eq('id', participantId)
                .eq('org_id', currentOrgId);

            if (setError) throw setError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking_guests', currentOrgId, bookingId] });
            toast({
                title: 'Sucesso',
                description: 'Hóspede principal atualizado.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao atualizar hóspede principal.',
                variant: 'destructive',
            });
        },
    });

    return {
        participants: participants || [],
        isLoading: isLoading || isOrgLoading,
        error,
        addParticipant,
        removeParticipant,
        setPrimaryParticipant,
    };
};
