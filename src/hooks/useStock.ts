import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryItem } from './useInventory'; // Import InventoryItem type

export type StockItem = {
    id: string; // Stock entry ID
    item_id: string;
    location: string;
    quantity: number;
    last_updated_at: string;
    item_details?: InventoryItem;
};

export const useStock = (location: string = 'pantry') => {
    const queryClient = useQueryClient();

    const { data: stock, isLoading } = useQuery({
        queryKey: ['item_stock', location],
        queryFn: async () => {
            // 1. Get all inventory items (catalog)
            const { data: catalog, error: catalogError } = await supabase
                .from('inventory_items')
                .select('*');

            if (catalogError) throw catalogError;

            // 2. Get current stock for this location
            const { data: currentStock, error: stockError } = await supabase
                .from('item_stock')
                .select('*')
                .eq('location', location);

            if (stockError) throw stockError;

            // 3. Merge: For every item in catalog, find its stock or default to 0
            const mergedStock: any[] = catalog.map(item => {
                const stockEntry = currentStock?.find(s => s.item_id === item.id);
                return {
                    id: stockEntry?.id || null, // null means no entry yet
                    item_id: item.id,
                    location: location,
                    quantity: stockEntry?.quantity || 0,
                    last_updated_at: stockEntry?.last_updated_at || null,
                    item_details: item
                };
            });

            return mergedStock;
        },
    });

    const updateStock = useMutation({
        mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
            // Upsert logic
            const { data, error } = await supabase
                .from('item_stock')
                .upsert({
                    item_id: itemId,
                    location: location,
                    quantity: quantity,
                    updated_by: (await supabase.auth.getUser()).data.user?.id
                }, { onConflict: 'item_id, location' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['item_stock', location] });
            // Toast is optional here to avoid spamming if frequent updates
        },
        onError: (error: Error) => {
            toast({ title: "Erro ao atualizar estoque", description: error.message, variant: "destructive" });
        },
    });

    return {
        stock: (stock || []) as StockItem[],
        isLoading,
        updateStock
    };
};
