import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useOrg } from './useOrg'; // Multi-tenant context

export interface FolioItem {
    id: string;
    booking_id: string;
    description: string;
    amount: number;
    category: 'rate' | 'service' | 'adjustment';
    created_at: string;
    created_by: string;
}

export interface FolioPayment {
    id: string;
    booking_id: string;
    amount: number;
    method: 'cash' | 'card' | 'pix' | 'stripe';
    payment_date: string;
    created_by: string;
}

export const useFolio = (bookingId?: string, orgId?: string | null) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { currentOrgId } = useOrg(); // Get current org if not passed
    const effectiveOrgId = orgId || currentOrgId; // Use passed orgId or fallback

    const { data: folioItems, isLoading: loadingItems } = useQuery({
        queryKey: ['folio-items', effectiveOrgId, bookingId], // Include org_id in cache key
        queryFn: async () => {
            // 🔐 SECURITY: Abort if no org_id or bookingId
            if (!bookingId || !effectiveOrgId) {
                console.warn('[useFolio] Abortando fetch folio_items: missing bookingId or orgId.');
                return [];
            }

            const { data, error } = await supabase
                .from('folio_items' as any)
                .select('*')
                .eq('booking_id', bookingId)
                .eq('org_id', effectiveOrgId) // 🔐 ALWAYS filter by org_id
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as FolioItem[];
        },
        enabled: !!bookingId && !!effectiveOrgId,
    });

    const { data: folioPayments, isLoading: loadingPayments } = useQuery({
        queryKey: ['folio-payments', effectiveOrgId, bookingId], // Include org_id in cache key
        queryFn: async () => {
            // 🔐 SECURITY: Abort if no org_id or bookingId
            if (!bookingId || !effectiveOrgId) {
                console.warn('[useFolio] Abortando fetch folio_payments: missing bookingId or orgId.');
                return [];
            }

            const { data, error } = await supabase
                .from('folio_payments' as any)
                .select('*')
                .eq('booking_id', bookingId)
                .eq('org_id', effectiveOrgId) // 🔐 ALWAYS filter by org_id
                .order('payment_date', { ascending: true });

            if (error) throw error;
            return data as FolioPayment[];
        },
        enabled: !!bookingId && !!effectiveOrgId,
    });

    const addItem = useMutation({
        mutationFn: async (item: Omit<FolioItem, 'id' | 'created_at' | 'created_by'>) => {
            const { data, error } = await supabase
                .from('folio_items' as any)
                .insert([{
                    ...item,
                    org_id: effectiveOrgId, // 🔐 ALWAYS include org_id
                    created_by: user?.id,
                    property_id: (item as any).property_id
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folio-items', effectiveOrgId, bookingId] });
            toast({ title: "Item Adicionado", description: "O lançamento foi registrado no folio." });
        }
    });

    const addPayment = useMutation({
        mutationFn: async (payment: Omit<FolioPayment, 'id' | 'payment_date' | 'created_by'>) => {
            const { data, error } = await supabase
                .from('folio_payments' as any)
                .insert([{
                    ...payment,
                    org_id: effectiveOrgId, // 🔐 ALWAYS include org_id
                    created_by: user?.id,
                    property_id: (payment as any).property_id
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folio-payments', effectiveOrgId, bookingId] });
            toast({ title: "Pagamento Registrado", description: "O pagamento foi processado com sucesso." });
        }
    });

    const totals = {
        totalCharges: folioItems?.reduce((acc, item) => acc + Number(item.amount), 0) || 0,
        totalPaid: folioPayments?.reduce((acc, pay) => acc + Number(pay.amount), 0) || 0,
        balance: (folioItems?.reduce((acc, item) => acc + Number(item.amount), 0) || 0) -
            (folioPayments?.reduce((acc, pay) => acc + Number(pay.amount), 0) || 0)
    };

    const closeFolio = useMutation({
        mutationFn: async () => {
            // 🔐 SECURITY: Ensure org_id is present
            if (!effectiveOrgId || !bookingId) {
                throw new Error('Missing org_id or booking_id for close folio');
            }

            const { error } = await supabase
                .from('bookings')
                .update({ status: 'completed' })
                .eq('id', bookingId)
                .eq('org_id', effectiveOrgId); // 🔐 ALWAYS filter by org_id

            if (error) throw error;
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking-folio', effectiveOrgId, bookingId] });
            queryClient.invalidateQueries({ queryKey: ['bookings', effectiveOrgId] });
            toast({ title: "Folio Fechado", description: "Reserva concluída com sucesso." });
        }
    });

    return {
        items: folioItems || [],
        payments: folioPayments || [],
        isLoading: loadingItems || loadingPayments,
        addItem,
        addPayment,
        closeFolio,
        totals
    };
};
