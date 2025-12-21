import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Department {
    id: string;
    property_id: string;
    name: string;
    active: boolean;
}

export interface StaffProfile {
    id: string;
    property_id: string;
    user_id: string | null;
    name: string;
    phone: string | null;
    role: string;
    departments: string[]; // Array of department IDs or names
    active: boolean;
}

export const useStaff = (propertyId: string) => {
    const queryClient = useQueryClient();

    const { data: departments, isLoading: loadingDepts } = useQuery({
        queryKey: ['departments', propertyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('departments' as any)
                .select('*')
                .eq('property_id', propertyId)
                .eq('active', true);
            if (error) throw error;
            return data as Department[];
        },
        enabled: !!propertyId,
    });

    const { data: staff, isLoading: loadingStaff } = useQuery({
        queryKey: ['staff', propertyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('staff_profiles' as any)
                .select('*')
                .eq('property_id', propertyId)
                .eq('active', true);
            if (error) throw error;
            return data as StaffProfile[];
        },
        enabled: !!propertyId,
    });

    const createStaff = useMutation({
        mutationFn: async (newStaff: Omit<StaffProfile, 'id'>) => {
            const { data, error } = await supabase
                .from('staff_profiles' as any)
                .insert([newStaff])
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff', propertyId] });
            toast({ title: "Colaborador Criado", description: "Perfil adicionado com sucesso." });
        }
    });

    return {
        departments: departments || [],
        staff: staff || [],
        isLoading: loadingDepts || loadingStaff,
        createStaff
    };
};
