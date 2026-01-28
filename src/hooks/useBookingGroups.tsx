import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useOrg } from '@/hooks/useOrg';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type BookingGroup = Tables<'booking_groups'>;
export type BookingGroupInsert = Omit<TablesInsert<'booking_groups'>, 'org_id'>;
export type BookingGroupUpdate = TablesUpdate<'booking_groups'>;

export const useBookingGroup = (bookingId: string | undefined, propertyId: string | undefined) => {
    const queryClient = useQueryClient();
    const { currentOrgId, isLoading: isOrgLoading } = useOrg();

    const { data: group, isLoading, error } = useQuery({
        queryKey: ['booking_group', currentOrgId, propertyId, bookingId],
        queryFn: async () => {
            if (!currentOrgId) throw new Error('Organization context required');
            if (!bookingId) throw new Error('Booking ID required');
            if (!propertyId) throw new Error('Property ID required');

            const { data, error } = await supabase
                .from('booking_groups')
                .select('*')
                .eq('org_id', currentOrgId)
                .eq('property_id', propertyId)
                .eq('booking_id', bookingId)
                .maybeSingle();

            if (error) throw error;
            return data as BookingGroup | null;
        },
        enabled: !!currentOrgId && !!bookingId && !!propertyId && !isOrgLoading,
    });

    return {
        group,
        isLoading: isLoading || isOrgLoading,
        error,
    };
};

export const useCreateBookingGroup = () => {
    const queryClient = useQueryClient();
    const { currentOrgId } = useOrg();

    return useMutation({
        mutationFn: async (groupData: BookingGroupInsert) => {
            if (!currentOrgId) throw new Error('Organization context required');

            const { data, error } = await supabase
                .from('booking_groups')
                .insert({
                    ...groupData,
                    org_id: currentOrgId,
                })
                .select()
                .single();

            if (error) throw error;
            return data as BookingGroup;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ['booking_group', currentOrgId, data.property_id, data.booking_id]
            });
            toast({
                title: 'Sucesso',
                description: 'Grupo criado com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao criar grupo.',
                variant: 'destructive',
            });
        },
    });
};

export const useUpdateBookingGroup = () => {
    const queryClient = useQueryClient();
    const { currentOrgId } = useOrg();

    return useMutation({
        mutationFn: async ({
            groupId,
            propertyId,
            bookingId,
            updates
        }: {
            groupId: string;
            propertyId: string;
            bookingId: string;
            updates: BookingGroupUpdate
        }) => {
            if (!currentOrgId) throw new Error('Organization context required');

            const { data, error } = await supabase
                .from('booking_groups')
                .update(updates)
                .eq('id', groupId)
                .eq('org_id', currentOrgId)
                .select()
                .single();

            if (error) throw error;
            return { data, propertyId, bookingId };
        },
        onSuccess: ({ propertyId, bookingId }) => {
            queryClient.invalidateQueries({
                queryKey: ['booking_group', currentOrgId, propertyId, bookingId]
            });
            toast({
                title: 'Sucesso',
                description: 'Grupo atualizado com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao atualizar grupo.',
                variant: 'destructive',
            });
        },
    });
};

export const useDeleteBookingGroup = () => {
    const queryClient = useQueryClient();
    const { currentOrgId } = useOrg();

    return useMutation({
        mutationFn: async ({
            groupId,
            propertyId,
            bookingId
        }: {
            groupId: string;
            propertyId: string;
            bookingId: string;
        }) => {
            if (!currentOrgId) throw new Error('Organization context required');

            const { error } = await supabase
                .from('booking_groups')
                .delete()
                .eq('id', groupId)
                .eq('org_id', currentOrgId);

            if (error) throw error;
            return { propertyId, bookingId };
        },
        onSuccess: ({ propertyId, bookingId }) => {
            queryClient.invalidateQueries({
                queryKey: ['booking_group', currentOrgId, propertyId, bookingId]
            });
            toast({
                title: 'Sucesso',
                description: 'Grupo removido com sucesso.',
            });
        },
        onError: (error: Error) => {
            toast({
                title: 'Erro',
                description: error.message || 'Erro ao remover grupo.',
                variant: 'destructive',
            });
        },
    });
};
