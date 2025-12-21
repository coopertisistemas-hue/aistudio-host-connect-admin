import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

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

export const useFolio = (bookingId?: string) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: folioItems, isLoading: loadingItems } = useQuery({
        queryKey: ['folio-items', bookingId],
        queryFn: async () => {
            if (!bookingId) return [];
            const { data, error } = await supabase
                .from('folio_items' as any)
                .select('*')
                .eq('booking_id', bookingId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data as FolioItem[];
        },
        enabled: !!bookingId,
    });

    const { data: folioPayments, isLoading: loadingPayments } = useQuery({
        queryKey: ['folio-payments', bookingId],
        queryFn: async () => {
            if (!bookingId) return [];
            const { data, error } = await supabase
                .from('folio_payments' as any)
                .select('*')
                .eq('booking_id', bookingId)
                .order('payment_date', { ascending: true });

            if (error) throw error;
            return data as FolioPayment[];
        },
        enabled: !!bookingId,
    });

    const addItem = useMutation({
        mutationFn: async (item: Omit<FolioItem, 'id' | 'created_at' | 'created_by'>) => {
            const { data, error } = await supabase
                .from('folio_items' as any)
                .insert([{
                    ...item,
                    created_by: user?.id,
                    property_id: (item as any).property_id // Assumed to be passed in or handled
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folio-items', bookingId] });
            toast({ title: "Item Adicionado", description: "O lançamento foi registrado no folio." });
        }
    });

    const addPayment = useMutation({
        mutationFn: async (payment: Omit<FolioPayment, 'id' | 'payment_date' | 'created_by'>) => {
            const { data, error } = await supabase
                .from('folio_payments' as any)
                .insert([{
                    ...payment,
                    created_by: user?.id,
                    property_id: (payment as any).property_id
                }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['folio-payments', bookingId] });
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
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'completed' })
                .eq('id', bookingId!);

            if (error) throw error;
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking-folio', bookingId] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
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
