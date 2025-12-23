import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OperationsSummary {
    criticalTasks: any[]; // Mixing Housekeeping/Maintenance
    recentOccurrences: any[];
    priorityRooms: any[];
}

export const useOperationsNow = (propertyId?: string) => {
    const queryClient = useQueryClient();

    const { data: summary, isLoading } = useQuery({
        queryKey: ['operations-now-summary', propertyId],
        queryFn: async () => {
            if (!propertyId) return { criticalTasks: [], recentOccurrences: [], priorityRooms: [] };

            // 1. Fetch Critical Tasks (High Priority Maintenance OR Housekeeping)
            const { data: criticalTasks, error: tasksError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    room:rooms(name, room_number)
                `)
                .eq('property_id', propertyId)
                .in('status', ['pending', 'in_progress'])
                .eq('priority', 'high')
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;

            // 2. Fetch Recent Occurrences (Type = 'occurrence')
            const { data: occurrences, error: occError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    room:rooms(name, room_number),
                    reporter:profiles!tasks_assigned_to_fkey(full_name)
                `)
                .eq('property_id', propertyId)
                .eq('type', 'occurrence')
                .order('created_at', { ascending: false })
                .limit(10);

            if (occError) throw occError;

            // 3. Fetch Priority Rooms (Arrivals/Departures Today)
            const today = new Date().toISOString().split('T')[0];
            const { data: priorityBookings, error: bookError } = await supabase
                .from('bookings')
                .select(`
                    *,
                    room:rooms(id, name, room_number, status)
                `)
                .eq('property_id', propertyId)
                .or(`check_in.eq.${today},check_out.eq.${today}`);

            if (bookError) throw bookError;

            return {
                criticalTasks: criticalTasks || [],
                recentOccurrences: occurrences || [],
                priorityRooms: priorityBookings || []
            };
        },
        enabled: !!propertyId
    });

    const createOccurrence = useMutation({
        mutationFn: async ({ title, description, priority, roomId }: {
            title: string;
            description: string;
            priority: 'low' | 'medium' | 'high';
            roomId?: string;
        }) => {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    property_id: propertyId,
                    type: 'occurrence',
                    status: 'pending',
                    title,
                    description,
                    priority,
                    room_id: roomId || null,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operations-now-summary'] });
            toast.success("Ocorrência registrada!");
        },
        onError: () => {
            toast.error("Erro ao registrar ocorrência.");
        }
    });

    return {
        summary,
        isLoading,
        createOccurrence
    };
};
