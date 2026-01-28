import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrg } from '@/hooks/useOrg';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface BookingRoom {
    id: string;
    org_id: string;
    property_id: string;
    booking_id: string;
    room_id: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
    room?: {
        room_number: string;
        status: string;
    };
}

export const useBookingRooms = (bookingId?: string, propertyId?: string) => {
    const { currentOrgId } = useOrg();

    return useQuery({
        queryKey: ['booking_rooms', currentOrgId, propertyId, bookingId],
        queryFn: async () => {
            if (!currentOrgId || !bookingId || !propertyId) return [];

            const { data, error } = await supabase
                .from('booking_rooms')
                .select(`
                    *,
                    room:rooms (
                        room_number,
                        status
                    )
                `)
                .eq('org_id', currentOrgId)
                .eq('property_id', propertyId)
                .eq('booking_id', bookingId);

            if (error) {
                console.error('[useBookingRooms] Fetch failed:', error);
                throw error;
            }

            return (data || []) as BookingRoom[];
        },
        enabled: !!currentOrgId && !!bookingId && !!propertyId,
    });
};

export const useAssignRoomToBooking = () => {
    const queryClient = useQueryClient();
    const { currentOrgId } = useOrg();
    const { userRole } = useAuth();
    const { toast } = useToast();
    const isViewer = userRole === 'viewer';

    return useMutation({
        mutationFn: async ({ bookingId, roomId, propertyId }: { bookingId: string; roomId: string; propertyId: string }) => {
            if (isViewer) throw new Error('VIEWER_BLOCKED');
            if (!currentOrgId) throw new Error('NO_ORG_CONTEXT');

            // Check for existing assignment to avoid duplication (though unique constraint exists)
            const { data: existing } = await supabase
                .from('booking_rooms')
                .select('id')
                .eq('org_id', currentOrgId)
                .eq('booking_id', bookingId)
                .eq('room_id', roomId)
                .maybeSingle();

            if (existing) return existing;

            // If we want is_primary, we might need to unmark others if this is primary
            // For now, we assume simple assignment as primary by default
            const { data, error } = await supabase
                .from('booking_rooms')
                .insert({
                    org_id: currentOrgId,
                    property_id: propertyId,
                    booking_id: bookingId,
                    room_id: roomId,
                    is_primary: true
                })
                .select()
                .single();

            if (error) {
                console.error('[useAssignRoomToBooking] Insert failed:', error);
                throw error;
            }

            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['booking_rooms', currentOrgId, variables.propertyId, variables.bookingId] });
            toast({
                title: 'Quarto atribuído',
                description: 'O quarto foi vinculado à reserva com sucesso.',
            });
        },
        onError: (error: any) => {
            const message = error.message === 'VIEWER_BLOCKED' 
                ? 'Ação não permitida para visualizadores.' 
                : 'Falha ao atribuir quarto.';
            
            toast({
                title: 'Erro',
                description: message,
                variant: 'destructive',
            });
        }
    });
};

export const useUnassignRoomFromBooking = (propertyId: string, bookingId: string) => {
    const queryClient = useQueryClient();
    const { currentOrgId } = useOrg();
    const { userRole } = useAuth();
    const { toast } = useToast();
    const isViewer = userRole === 'viewer';

    return useMutation({
        mutationFn: async (bookingRoomId: string) => {
            if (isViewer) throw new Error('VIEWER_BLOCKED');
            if (!currentOrgId) throw new Error('NO_ORG_CONTEXT');

            const { error } = await supabase
                .from('booking_rooms')
                .delete()
                .eq('id', bookingRoomId)
                .eq('org_id', currentOrgId);

            if (error) {
                console.error('[useUnassignRoomFromBooking] Delete failed:', error);
                throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking_rooms', currentOrgId, propertyId, bookingId] });
            toast({
                title: 'Atribuição removida',
                description: 'O quarto foi desvinculado da reserva.',
            });
        },
        onError: (error: any) => {
            const message = error.message === 'VIEWER_BLOCKED' 
                ? 'Ação não permitida para visualizadores.' 
                : 'Falha ao remover atribuição.';
            
            toast({
                title: 'Erro',
                description: message,
                variant: 'destructive',
            });
        }
    });
};
