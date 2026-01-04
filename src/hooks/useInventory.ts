import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useOrg } from './useOrg';

export const inventoryItemSchema = z.object({
    name: z.string().min(1, "O nome do item é obrigatório."),
    category: z.string().default('Geral'),
    description: z.string().optional().nullable(),
    price: z.number().min(0).default(0),
    is_for_sale: z.boolean().default(false),
    unit: z.string().default('UN'),
    min_stock: z.number().min(0).default(5),
});

export type InventoryItem = {
    id: string;
    org_id: string;
    name: string;
    category: string;
    description: string | null;
    price: number;
    is_for_sale: boolean;
    unit?: string;
    min_stock?: number;
    created_at: string;
};

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

export const useInventory = () => {
    const queryClient = useQueryClient();
    const { currentOrgId } = useOrg();

    const { data: items, isLoading, error } = useQuery({
        queryKey: ['inventory_items', currentOrgId],
        queryFn: async () => {
            if (!currentOrgId) return [];
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('org_id', currentOrgId)
                .order('name', { ascending: true });

            if (error) throw error;
            return data as InventoryItem[];
        },
        enabled: !!currentOrgId,
    });

    const createItem = useMutation({
        mutationFn: async (item: InventoryItemInput) => {
            if (!currentOrgId) throw new Error("No Organization ID");
            const { data, error } = await supabase
                .from('inventory_items')
                .insert([{ ...item, org_id: currentOrgId }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_items', currentOrgId] });
            toast({
                title: "Sucesso!",
                description: "Item de inventário criado.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('inventory_items')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_items', currentOrgId] });
            toast({
                title: "Sucesso!",
                description: "Item removido.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const updateItem = useMutation({
        mutationFn: async ({ id, item }: { id: string; item: Partial<InventoryItemInput> }) => {
            const { data, error } = await supabase
                .from('inventory_items')
                .update(item)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory_items', currentOrgId] });
            toast({
                title: "Sucesso!",
                description: "Item atualizado.",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Erro",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return {
        items: items || [],
        isLoading,
        error,
        createItem,
        updateItem,
        deleteItem,
    };
};
