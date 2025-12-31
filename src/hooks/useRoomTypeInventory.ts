import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type RoomTypeInventoryItem = {
    id: string; // The link ID
    room_type_id: string;
    item_id: string;
    quantity: number;
    item_details?: {
        name: string;
        category: string;
        description: string | null;
    };
};

export const useRoomTypeInventory = (roomTypeId?: string) => {
    const queryClient = useQueryClient();

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['room_type_inventory', roomTypeId],
        queryFn: async () => {
            if (!roomTypeId) return [];
            const { data, error } = await supabase
                .from('room_type_inventory')
                .select(`
          *,
          item_details:inventory_items (name, category, description)
        `)
                .eq('room_type_id', roomTypeId);

            if (error) throw error;
            return data as any[]; // Type assertion for joined data
        },
        enabled: !!roomTypeId,
    });

    const addItem = useMutation({
        mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
            if (!roomTypeId) throw new Error("No Room Type ID");
            const { data, error } = await supabase
                .from('room_type_inventory')
                .insert({
                    room_type_id: roomTypeId,
                    item_id: itemId,
                    quantity: quantity
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room_type_inventory', roomTypeId] });
            toast({ title: "Item adicionado ao inventário." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao adicionar item", description: error.message, variant: "destructive" });
        },
    });

    const updateQuantity = useMutation({
        mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
            const { data, error } = await supabase
                .from('room_type_inventory')
                .update({ quantity })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room_type_inventory', roomTypeId] });
            toast({ title: "Quantidade atualizada." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        },
    });

    const removeItem = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('room_type_inventory')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['room_type_inventory', roomTypeId] });
            toast({ title: "Item removido do inventário." });
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
        },
    });

    return {
        inventory: (inventory || []) as RoomTypeInventoryItem[],
        isLoading,
        addItem,
        updateQuantity,
        removeItem
    };
};
