import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useRoomOperation } from './useRoomOperation';
import { useOrg } from '@/hooks/useOrg'; // Multi-tenant context
import { safeLogger } from '@/lib/logging/safeLogger';

export type DemandStatus = 'todo' | 'in-progress' | 'waiting' | 'done';
export type DemandPriority = 'low' | 'medium' | 'high' | 'critical';

export interface MaintenanceDemand {
    id: string;
    title: string;
    description: string | null;
    status: DemandStatus;
    priority: DemandPriority;
    category: string | null;
    room_id: string | null;
    property_id: string;
    impact_operation: boolean;
    assigned_to: string | null;
    created_at: string;
    due_date: string | null;
    rooms?: {
        room_number: string;
        status: string;
    };
    profiles?: {
        full_name: string;
    };
}

export const useDemands = (propertyId?: string) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { currentOrgId } = useOrg();
    const { updateStatus: updateRoomStatus } = useRoomOperation(propertyId);

    const { data: demands, isLoading } = useQuery<MaintenanceDemand[]>({
        queryKey: ['maintenance-demands', currentOrgId, propertyId],
        queryFn: async (): Promise<MaintenanceDemand[]> => {
            if (!currentOrgId) {
                safeLogger.warn('demands.fetch.no_org');
                return [];
            }
            if (!propertyId) return [];
            const { data, error } = await (supabase as any)
                .from('tasks')
                .select(`
          *,
          rooms (
            room_number,
            status
          ),
          profiles (
            full_name
          )
        `)
                .eq('org_id', currentOrgId) // 🔐 ALWAYS filter by org_id
                .eq('property_id', propertyId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as unknown as MaintenanceDemand[];
        },
        enabled: !!propertyId,
    });

    const createDemand = useMutation<unknown, Error, any>({
        mutationFn: async (demand: any) => {
            const { data, error } = await (supabase as any)
                .from('tasks')
                .insert([{
                    ...demand,
                    org_id: currentOrgId, // 🔐 ALWAYS include org_id
                    property_id: propertyId,
                    assigned_to: demand.assigned_to || user?.id
                }])
                .select()
                .single();

            if (error) throw error;

            // Integration: If impact_operation is true, set room to OOO
            if (demand.impact_operation && demand.room_id) {
                await updateRoomStatus.mutateAsync({
                    roomId: demand.room_id,
                    newStatus: 'ooo',
                    oldStatus: 'available', // Idealmente buscar o atual, mas o hook cuida
                    reason: `Manutenção: ${demand.title}`
                });
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-demands', currentOrgId, propertyId] });
            toast({ title: "Demanda Criada", description: "A solicitação foi registrada com sucesso." });
        }
    });

    const updateDemandStatus = useMutation<unknown, Error, { id: string; status: DemandStatus; roomId?: string; impact_operation?: boolean }>({
        mutationFn: async ({ id, status, roomId, impact_operation }: { id: string; status: DemandStatus; roomId?: string; impact_operation?: boolean }) => {
            const { data, error } = await (supabase as any)
                .from('tasks')
                .update({ status } as any)
                .eq('id', id)
                .eq('org_id', currentOrgId); // 🔐 ALWAYS filter by org_id

            if (error) throw error;

            // If done and was impacting operation, check if we should clear OOO
            if (status === 'done' && impact_operation && roomId) {
                // Logic to suggest clearing OOO would go here or be manual in detail Page
            }

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-demands', currentOrgId, propertyId] });
            queryClient.invalidateQueries({ queryKey: ['demand-detail', currentOrgId] });
        }
    });

    return { demands, isLoading, createDemand, updateDemandStatus };
};
