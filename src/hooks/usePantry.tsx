import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PantryTask {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    room_id?: string;
    created_at: string;
    room?: {
        name: string;
        room_number: string;
    };
    reporter?: {
        full_name: string;
    };
}

export const usePantry = (propertyId?: string) => {
    const queryClient = useQueryClient();

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['pantry-tasks', propertyId],
        queryFn: async () => {
            if (!propertyId) return [];
            // Cast as any to break complex recursion in Supabase types
            const { data, error } = await supabase
                .from('tasks')
                .select(`
                    *,
                    room:rooms(name, room_number),
                    reporter:profiles!tasks_assigned_to_fkey(full_name)
                `)
                .eq('property_id', propertyId)
                .in('type', ['pantry', 'kitchen'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data as any) as PantryTask[];
        },
        enabled: !!propertyId
    });

    const createPantryTask = useMutation({
        mutationFn: async ({ title, description, roomId, priority = 'medium' }: {
            title: string;
            description?: string;
            roomId?: string;
            priority?: 'low' | 'medium' | 'high';
        }) => {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    property_id: propertyId,
                    type: 'pantry',
                    status: 'pending',
                    title,
                    description,
                    room_id: roomId || null,
                    priority,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pantry-tasks'] });
            toast.success("Pedido enviado para a copa!");
        },
        onError: () => {
            toast.error("Erro ao enviar pedido.");
        }
    });

    const updateStatus = useMutation({
        mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
            const { error } = await supabase
                .from('tasks')
                .update({ status })
                .eq('id', taskId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pantry-tasks'] });
            toast.success("Status atualizado");
        },
        onError: () => {
            toast.error("Erro ao atualizar status.");
        }
    });

    return {
        tasks,
        isLoading,
        createPantryTask,
        updateStatus
    };
};
