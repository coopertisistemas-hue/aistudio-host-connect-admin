import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaintenanceTask {
    id: string;
    room_id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    title: string;
    description: string | null;
    created_at: string;
    assigned_to: string | null;
    property_id: string;
    room?: {
        name: string;
        room_number: string;
    };
    assignee?: {
        full_name: string;
    } | null;
}

export const useMaintenance = (propertyId?: string) => {
    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['maintenance-tasks', propertyId],
        queryFn: async () => {
            if (!propertyId) return [];

            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    room:rooms(name, room_number),
                    assignee:profiles!tasks_assigned_to_fkey(full_name)
                `)
                .eq('property_id', propertyId)
                .eq('type', 'maintenance')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as MaintenanceTask[];
        },
        enabled: !!propertyId
    });

    const createTicket = useMutation({
        mutationFn: async ({ roomId, title, description, priority }: {
            roomId: string;
            title: string;
            description: string;
            priority: 'low' | 'medium' | 'high';
        }) => {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    property_id: propertyId,
                    room_id: roomId,
                    type: 'maintenance',
                    status: 'pending',
                    title,
                    description,
                    priority,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
            toast.success("Chamado criado com sucesso!");
        },
        onError: () => {
            toast.error("Erro ao criar chamado.");
        }
    });

    const updateStatus = useMutation({
        mutationFn: async ({ taskId, status }: { taskId: string; status: MaintenanceTask['status'] }) => {
            const { error } = await supabase
                .from('tasks')
                .update({ status })
                .eq('id', taskId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
            toast.success("Status atualizado!");
        }
    });

    const assignToMe = useMutation({
        mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
            const { error } = await supabase
                .from('tasks')
                .update({ assigned_to: userId, status: 'in_progress' })
                .eq('id', taskId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-tasks'] });
            toast.success("Chamado assumido!");
        }
    });

    return {
        tasks,
        isLoading,
        createTicket,
        updateStatus,
        assignToMe
    };
};
