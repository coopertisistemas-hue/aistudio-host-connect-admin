import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export type RoomOperationalStatus = 'available' | 'occupied' | 'maintenance' | 'dirty' | 'clean' | 'inspected' | 'ooo';

export interface RoomStatusLog {
    id: string;
    room_id: string;
    old_status: string;
    new_status: string;
    user_id: string;
    reason?: string;
    created_at: string;
    profiles?: {
        full_name: string;
    };
}

export const useRoomOperation = (propertyId?: string) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const updateStatus = useMutation({
        mutationFn: async ({
            roomId,
            newStatus,
            oldStatus,
            reason
        }: {
            roomId: string;
            newStatus: RoomOperationalStatus;
            oldStatus: string;
            reason?: string
        }) => {
            // 1. Update Room Status
            const { error: updateError } = await supabase
                .from('rooms')
                .update({ status: newStatus })
                .eq('id', roomId);

            if (updateError) throw updateError;

            // 2. Log the change (if room_status_logs table exists, else we just update)
            // Note: We'll assume for now we might need to create this table or use a generic log
            const { error: logError } = await supabase
                .from('room_status_logs')
                .insert([{
                    room_id: roomId,
                    old_status: oldStatus,
                    new_status: newStatus,
                    user_id: user?.id,
                    reason: reason || null
                }]);

            if (logError) {
                console.error('Error logging status change:', logError);
                // Don't fail the whole operation if logging fails, but notify
            }

            return { roomId, newStatus };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rooms', propertyId] });
            queryClient.invalidateQueries({ queryKey: ['room-detail'] });
            toast({
                title: "Status Atualizado",
                description: "O status do quarto foi alterado com sucesso.",
            });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao atualizar",
                description: error.message,
                variant: "destructive",
            });
        }
    });

    const getStatusLogs = (roomId: string) => {
        return useQuery({
            queryKey: ['room-status-logs', roomId],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('room_status_logs')
                    .select(`
            *,
            profiles (
              full_name
            )
          `)
                    .eq('room_id', roomId)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (error) throw error;
                return data as RoomStatusLog[];
            },
            enabled: !!roomId,
        });
    };

    return {
        updateStatus,
        getStatusLogs,
    };
};
