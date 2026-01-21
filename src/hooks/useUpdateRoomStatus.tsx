import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrg } from '@/hooks/useOrg';
import { useAuth } from '@/hooks/useAuth';

/**
 * Canonical housekeeping status values
 */
export type RoomStatus =
    | 'dirty'          // Needs cleaning (post-checkout)
    | 'cleaning'       // Being cleaned (in-progress)
    | 'clean'          // Clean (ready for inspection or occupancy)
    | 'inspected'      // Passed QA inspection
    | 'out_of_order'   // Not available (maintenance)
    // Legacy values (backward compatibility)
    | 'available'
    | 'occupied'
    | 'maintenance';

interface UpdateRoomStatusParams {
    roomId: string;
    newStatus: RoomStatus;
    propertyId: string; // Required for multi-tenant scoping
}

/**
 * Hook for updating room status with housekeeping-specific guards
 * 
 * Guards:
 * - Viewer role cannot mutate (blocked)
 * - Multi-tenant: org_id + property_id scoping enforced
 * - PT-BR error messages
 * 
 * React Query invalidation:
 * -rooms query (orgId + propertyId)
 * - housekeeping query (if exists in future)
 */
export const useUpdateRoomStatus = () => {
    const queryClient = useQueryClient();
    const { currentOrgId } = useOrg();
    const { userRole } = useAuth();
    const { toast } = useToast();

    const isViewer = userRole === 'viewer';

    return useMutation({
        mutationFn: async ({ roomId, newStatus, propertyId }: UpdateRoomStatusParams) => {
            // Guard: Viewer role cannot mutate
            if (isViewer) {
                throw new Error('VIEWER_BLOCKED');
            }

            // Guard: Org context required
            if (!currentOrgId) {
                throw new Error('NO_ORG_CONTEXT');
            }

            // Guard: Property required
            if (!propertyId) {
                throw new Error('NO_PROPERTY');
            }

            // Fetch room to verify ownership (multi-tenant safety)
            const { data: room, error: fetchError } = await supabase
                .from('rooms')
                .select('id, org_id, property_id, status')
                .eq('id', roomId)
                .eq('org_id', currentOrgId)
                .eq('property_id', propertyId)
                .single();

            if (fetchError || !room) {
                console.error('[useUpdateRoomStatus] Room not found or access denied:', fetchError);
                throw new Error('ROOM_NOT_FOUND');
            }

            // Update room status
            const { data, error } = await supabase
                .from('rooms')
                .update({
                    status: newStatus,
                    updated_by: (await supabase.auth.getUser()).data.user?.id // Audit trail
                })
                .eq('id', roomId)
                .eq('org_id', currentOrgId) // Multi-tenant protection
                .eq('property_id', propertyId) // Property-level protection
                .select()
                .single();

            if (error) {
                console.error('[useUpdateRoomStatus] Update failed:', error);
                throw new Error('UPDATE_FAILED');
            }

            return data;
        },
        onSuccess: (data, variables) => {
            // Invalidate rooms queries
            queryClient.invalidateQueries({ queryKey: ['rooms', currentOrgId, variables.propertyId] });

            // Future: invalidate housekeeping-specific queries
            // queryClient.invalidateQueries({ queryKey: ['housekeeping-rooms', currentOrgId, variables.propertyId] });

            // Success toast (PT-BR)
            toast({
                title: 'Status atualizado',
                description: `Status do quarto alterado para: ${getStatusLabel(variables.newStatus)}`,
            });
        },
        onError: (error: Error) => {
            // PT-BR error messages
            const errorMessages: Record<string, string> = {
                VIEWER_BLOCKED: 'Ação não permitida. Usuários visualizadores não podem alterar status de quartos.',
                NO_ORG_CONTEXT: 'Erro de contexto organizacional. Tente recarregar a página.',
                NO_PROPERTY: 'Propriedade não selecionada.',
                ROOM_NOT_FOUND: 'Quarto não encontrado ou acesso negado.',
                UPDATE_FAILED: 'Falha ao atualizar status do quarto. Tente novamente.',
            };

            const message = errorMessages[error.message] || 'Erro desconhecido ao atualizar status.';

            console.error('[useUpdateRoomStatus] Error:', error.message);

            toast({
                title: 'Erro',
                description: message,
                variant: 'destructive',
            });
        },
    });
};

/**
 * Get PT-BR label for room status
 */
export const getStatusLabel = (status: RoomStatus): string => {
    const labels: Record<RoomStatus, string> = {
        dirty: 'Sujo',
        cleaning: 'Em limpeza',
        clean: 'Limpo',
        inspected: 'Inspecionado',
        out_of_order: 'Fora de serviço',
        // Legacy
        available: 'Disponível',
        occupied: 'Ocupado',
        maintenance: 'Manutenção',
    };

    return labels[status] || status;
};

/**
 * Get status badge variant for UI
 */
export const getStatusVariant = (status: RoomStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<RoomStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        dirty: 'destructive',
        cleaning: 'secondary',
        clean: 'default',
        inspected: 'default',
        out_of_order: 'destructive',
        // Legacy
        available: 'default',
        occupied: 'secondary',
        maintenance: 'destructive',
    };

    return variants[status] || 'outline';
};
