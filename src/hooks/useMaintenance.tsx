import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MaintenanceTask {
    id: string;
    // @ts-ignore
    room_id?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    // @ts-ignore
    priority?: 'low' | 'medium' | 'high';
    title: string;
    description: string | null;
    created_at: string;
    assigned_to: string | null;
    property_id: string;
    room?: {
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
                    assignee:profiles!tasks_assigned_to_fkey(full_name)
                `)
                .eq('property_id', propertyId)
                // .eq('type', 'maintenance') // Column 'type' does not exist in schema
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as MaintenanceTask[];
        },
        enabled: !!propertyId
    });

    const createTicket = useMutation({
        mutationFn: async ({ roomId, title, description, priority, assignedTo }: {
            roomId: string;
            title: string;
            description: string;
            priority: 'low' | 'medium' | 'high';
            assignedTo?: string;
        }) => {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    property_id: propertyId,
                    // room_id: roomId, // Missing in schema
                    // type: 'maintenance', // Missing in schema
                    status: 'pending',
                    title,
                    description: description + (roomId ? ` [Room ID: ${roomId}]` : ` [Priority: ${priority}]`), // Hack to store info
                    // priority, // Missing in schema
                    assigned_to: assignedTo, // Support self-assignment
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
