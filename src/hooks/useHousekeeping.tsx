import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HousekeepingTask {
    id: string;
    room_id: string;
    reservation_id: string | null;
    status: 'pending' | 'cleaning' | 'completed' | 'maintenance_required';
    priority: 'low' | 'medium' | 'high';
    notes: string | null;
    assigned_to: string | null;
    property_id: string;
    created_at: string;
    room?: {
        name: string;
        room_number: string;
        status: string;
    };
    reservation?: {
        guest_name: string;
        check_in: string;
        check_out: string;
    };
}

export const useHousekeeping = (propertyId?: string, userId?: string) => {
    const queryClient = useQueryClient();

    // Fetch housekeeping tasks
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['housekeeping-tasks', propertyId, userId],
        queryFn: async () => {
            if (!propertyId) return [];
            let query = supabase
                .from('tasks')
                .select(`
          *,
          room:rooms(name, room_number, status),
          reservation:bookings(guest_name, check_in, check_out)
        `)
                .eq('property_id', propertyId)
                .eq('type', 'housekeeping')
                .order('created_at', { ascending: false });

            if (userId) {
                query = query.eq('assigned_to', userId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as HousekeepingTask[];
        },
        enabled: !!propertyId
    });

    // Update task and room status
    const updateTaskStatus = useMutation({
        mutationFn: async ({ taskId, roomId, status, notes }: {
            taskId: string;
            roomId: string;
            status: HousekeepingTask['status'];
            notes?: string;
        }) => {
            // 1. Update the task
            const { error: taskError } = await supabase
                .from('tasks')
                .update({ status, notes, updated_at: new Date().toISOString() })
                .eq('id', taskId);

            if (taskError) throw taskError;

            // 2. Map task status to room status
            let roomStatus = 'maintenance';
            if (status === 'completed') roomStatus = 'available';
            if (status === 'cleaning') roomStatus = 'maintenance'; // or 'cleaning' if your schema supports it

            const { error: roomError } = await supabase
                .from('rooms')
                .update({ status: roomStatus })
                .eq('id', roomId);

            if (roomError) throw roomError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
            toast.success("Status atualizado com sucesso");
        }
    });

    // Register consumption (Minibar/Amenities)
    const addConsumption = useMutation({
        mutationFn: async ({ reservationId, items }: {
            reservationId: string;
            items: { name: string; quantity: number; price: number }[]
        }) => {
            const charges = items.map(item => ({
                booking_id: reservationId,
                description: `Consumo: ${item.name} (x${item.quantity})`,
                amount: item.price * item.quantity,
                category: 'minibar',
                created_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('folia_charges') // Adjusting to the common naming in this project if it exists, or reservation_charges
                .insert(charges);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Consumo registrado no extrato");
        }
    });

    // Open maintenance ticket
    const openMaintenance = useMutation({
        mutationFn: async ({ roomId, propertyId, description }: {
            roomId: string;
            propertyId: string;
            description: string
        }) => {
            const { error } = await supabase
                .from('tasks')
                .insert({
                    property_id: propertyId,
                    room_id: roomId,
                    type: 'maintenance',
                    status: 'pending',
                    priority: 'medium',
                    title: `Reparo solicitado pela Governança`,
                    description,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Chamado de manutenção aberto");
        }
    });

    return {
        tasks,
        isLoading,
        updateTaskStatus,
        addConsumption,
        openMaintenance
    };
};
