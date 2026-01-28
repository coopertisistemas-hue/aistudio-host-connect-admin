import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryItem } from './useInventory'; // Import InventoryItem type
import { useOrg } from '@/hooks/useOrg';
import { useAuth } from './useAuth';

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
    const { currentOrgId } = useOrg();
    const { user } = useAuth();

    const { data: stock, isLoading } = useQuery({
        queryKey: ['item_stock', currentOrgId, location],
        queryFn: async () => {
            if (!currentOrgId) return [];
            // 1. Get all inventory items (catalog)
            const { data: catalog, error: catalogError } = await supabase
                .from('inventory_items' as any)
                .select('*')
                .eq('org_id', currentOrgId);
            const catalogData = catalog as any[] || [];

            if (catalogError) throw catalogError;

            // 2. Get current stock for this location
            const { data: currentStock, error: stockError } = await supabase
                .from('item_stock' as any)
                .select('*')
                .eq('location', location)
                .eq('org_id', currentOrgId);
            const stockData = currentStock as any[] || [];

            if (stockError) throw stockError;

            // 3. Merge: For every item in catalog, find its stock or default to 0
            const mergedStock: any[] = catalogData.map(item => {
                const stockEntry = stockData?.find(s => s.item_id === item.id);
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
            if (!currentOrgId) throw new Error("No Organization ID");
            // Upsert logic
            const { data, error } = await supabase
                .from('item_stock' as any)
                .upsert({
                    item_id: itemId,
                    location: location,
                    quantity: quantity,
                    org_id: currentOrgId,
                    updated_by: user?.id
                }, { onConflict: 'item_id, location, org_id' } as any)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['item_stock', currentOrgId, location] });
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
