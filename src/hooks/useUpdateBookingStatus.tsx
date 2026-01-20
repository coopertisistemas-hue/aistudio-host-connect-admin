import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from './useOrg';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { BookingStatus } from '@/lib/constants/statuses';

interface UpdateBookingStatusParams {
    bookingId: string;
    newStatus: BookingStatus;
    propertyId?: string;
}

/**
 * Hook to safely update booking status with multi-tenant scoping and role guards
 */
export const useUpdateBookingStatus = () => {
    const { currentOrgId } = useOrg();
    const { userRole } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ bookingId, newStatus, propertyId }: UpdateBookingStatusParams) => {
            // Guard: Viewer role cannot mutate
            if (userRole === 'viewer') {
                throw new Error('VIEWER_BLOCKED');
            }

            // Guard: Org context required
            if (!currentOrgId) {
                throw new Error('NO_ORG_CONTEXT');
            }

            console.log('[useUpdateBookingStatus] Updating booking:', { bookingId, newStatus, orgId: currentOrgId });

            // Fetch current booking to verify org ownership
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('id, org_id, status')
                .eq('id', bookingId)
                .eq('org_id', currentOrgId) // 🔐 MANDATORY org scoping
                .single();

            if (fetchError || !booking) {
                console.error('[useUpdateBookingStatus] Booking not found or access denied:', fetchError);
                throw new Error('BOOKING_NOT_FOUND');
            }

            // Update booking status
            const { data, error } = await supabase
                .from('bookings')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', bookingId)
                .eq('org_id', currentOrgId) // 🔐 Double-check org scoping on update
                .select()
                .single();

            if (error) {
                console.error('[useUpdateBookingStatus] Update failed:', error);
                throw new Error('UPDATE_FAILED');
            }

            console.log('[useUpdateBookingStatus] Status updated successfully:', data);
            return data;
        },
        onSuccess: (data, variables) => {
            // Invalidate all relevant queries
            queryClient.invalidateQueries({ queryKey: ['frontdesk-arrivals'] });
            queryClient.invalidateQueries({ queryKey: ['frontdesk-departures'] });
            queryClient.invalidateQueries({ queryKey: ['frontdesk-inhouse'] });
            queryClient.invalidateQueries({ queryKey: ['booking-folio', currentOrgId, variables.bookingId] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });

            toast({
                title: 'Status atualizado',
                description: 'O status da reserva foi alterado com sucesso.',
                variant: 'default',
            });
        },
        onError: (error: Error) => {
            console.error('[useUpdateBookingStatus] Mutation error:', error);

            // PT-BR error messages
            const errorMessages: Record<string, { title: string; description: string }> = {
                VIEWER_BLOCKED: {
                    title: 'Ação não permitida',
                    description: 'Usuários com perfil de visualização não podem alterar status.',
                },
                NO_ORG_CONTEXT: {
                    title: 'Erro de contexto',
                    description: 'Organização não identificada. Recarregue a página.',
                },
                BOOKING_NOT_FOUND: {
                    title: 'Reserva não encontrada',
                    description: 'A reserva não existe ou você não tem permissão para acessá-la.',
                },
                UPDATE_FAILED: {
                    title: 'Falha na atualização',
                    description: 'Não foi possível atualizar o status. Tente novamente.',
                },
            };

            const errorMessage = errorMessages[error.message] || {
                title: 'Erro desconhecido',
                description: 'Ocorreu um erro inesperado. Tente novamente.',
            };

            toast({
                title: errorMessage.title,
                description: errorMessage.description,
                variant: 'destructive',
            });
        },
    });
};
