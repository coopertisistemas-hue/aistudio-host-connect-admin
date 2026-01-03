import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';

export const roomCategorySchema = z.object({
    name: z.string().min(1, "O nome da categoria é obrigatório."),
    slug: z.string().min(1, "O slug é obrigatório.").regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens."),
    description: z.string().optional().nullable(),
    display_order: z.number().min(0).default(0),
});

export type RoomCategory = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
};

export type RoomCategoryInput = z.infer<typeof roomCategorySchema>;

export const useRoomCategories = () => {
    const queryClient = useQueryClient();

    const { data: categories, isLoading, error } = useQuery({
        queryKey: ['room_categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('room_categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as RoomCategory[];
        },
    });

    const createCategory = useMutation({
        mutationFn: async (category: RoomCategoryInput) => {
            const { data, error } = await supabase
                .from('room_categories')
                .insert([category])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room_categories'] });
            toast({
                title: "Sucesso!",
                description: "Categoria criada com sucesso.",
            });
        },
        onError: (error: Error) => {
            console.error('Error creating category:', error);
            toast({
                title: "Erro",
                description: "Erro ao criar categoria: " + error.message,
                variant: "destructive",
            });
        },
    });

    const updateCategory = useMutation({
        mutationFn: async ({ id, category }: { id: string; category: Partial<RoomCategoryInput> }) => {
            const { data, error } = await supabase
                .from('room_categories')
                .update(category)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room_categories'] });
            toast({
                title: "Sucesso!",
                description: "Categoria atualizada com sucesso.",
            });
        },
        onError: (error: Error) => {
            console.error('Error updating category:', error);
            toast({
                title: "Erro",
                description: "Erro ao atualizar categoria: " + error.message,
                variant: "destructive",
            });
        },
    });

    const deleteCategory = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('room_categories')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room_categories'] });
            toast({
                title: "Sucesso!",
                description: "Categoria removida com sucesso.",
            });
        },
        onError: (error: Error) => {
            console.error('Error deleting category:', error);
            toast({
                title: "Erro",
                description: "Erro ao remover categoria: " + error.message,
                variant: "destructive",
            });
        },
    });

    return {
        categories: categories || [],
        isLoading,
        error,
        createCategory,
        updateCategory,
        deleteCategory,
    };
};
