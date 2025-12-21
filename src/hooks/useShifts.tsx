import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export interface Shift {
    id: string;
    property_id: string;
    department_id: string | null;
    start_at: string;
    end_at: string;
    status: 'planned' | 'active' | 'closed';
    notes: string | null;
    created_at: string;
}

export interface ShiftAssignment {
    id: string;
    shift_id: string;
    staff_id: string;
    role_on_shift: string | null;
    status: 'assigned' | 'confirmed' | 'absent';
    check_in_at: string | null;
    check_out_at: string | null;
}

export interface Handoff {
    id: string;
    shift_id: string;
    text: string;
    tags: string[];
    created_at: string;
    created_by: string;
}

export const useShifts = (propertyId: string) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: shifts, isLoading: loadingShifts } = useQuery({
        queryKey: ['shifts', propertyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('shifts' as any)
                .select('*, departments(name), shift_assignments(*, staff_profiles(name))' as any)
                .eq('property_id', propertyId)
                .order('start_at', { ascending: true });
            if (error) throw error;
            return data as any[];
        },
        enabled: !!propertyId,
    });

    const createShift = useMutation({
        mutationFn: async (newShift: Omit<Shift, 'id' | 'created_at' | 'status'> & { assignments: string[] }) => {
            // 1. Create Shift
            const { data: shift, error: shiftError } = await supabase
                .from('shifts' as any)
                .insert([{
                    property_id: newShift.property_id,
                    department_id: newShift.department_id,
                    start_at: newShift.start_at,
                    end_at: newShift.end_at,
                    notes: newShift.notes,
                    created_by: user?.id,
                    status: 'planned'
                } as any])
                .select()
                .single();

            if (shiftError) throw shiftError;

            const shiftId = (shift as any).id;

            // 2. Create Assignments
            if (newShift.assignments.length > 0) {
                const { error: assignError } = await supabase
                    .from('shift_assignments' as any)
                    .insert(newShift.assignments.map(staffId => ({
                        shift_id: shiftId,
                        staff_id: staffId,
                        status: 'assigned'
                    }) as any));
                if (assignError) throw assignError;
            }
            return shift;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts', propertyId] });
            toast({ title: "Escala Criada", description: "O plantão foi agendado com sucesso." });
        }
    });

    const updateShiftStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: Shift['status'] }) => {
            const { error } = await supabase
                .from('shifts' as any)
                .update({ status })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shifts', propertyId] });
        }
    });

    const addHandoff = useMutation({
        mutationFn: async (handoff: Omit<Handoff, 'id' | 'created_at' | 'created_by'>) => {
            const { data, error } = await supabase
                .from('shift_handoffs' as any)
                .insert([{
                    ...handoff,
                    created_by: user?.id
                } as any])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['shifts', propertyId] });
            queryClient.invalidateQueries({ queryKey: ['handoffs', variables.shift_id] });
            toast({ title: "Nota de Handoff", description: "Sua observação foi registrada." });
        }
    });

    return {
        shifts: shifts || [],
        isLoading: loadingShifts,
        createShift,
        updateShiftStatus,
        addHandoff
    };
};
