import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export interface ReservationQuote {
    id: string;
    lead_id: string;
    property_id: string;
    currency: string;
    subtotal: number;
    fees: number;
    taxes: number;
    total: number;
    policy_text: string | null;
    expires_at: string | null;
    sent_at: string | null;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    created_by: string;
    created_at: string;
}

export const useQuotes = (leadId?: string) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: quotes, isLoading } = useQuery({
        queryKey: ['quotes', leadId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reservation_quotes' as any)
                .select('*')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as ReservationQuote[];
        },
        enabled: !!leadId,
    });

    const createQuote = useMutation({
        mutationFn: async (newQuote: Omit<ReservationQuote, 'id' | 'created_at' | 'created_by' | 'sent_at'>) => {
            const { data, error } = await supabase
                .from('reservation_quotes' as any)
                .insert([{
                    ...newQuote,
                    created_by: user?.id
                } as any])
                .select()
                .single();
            if (error) throw error;

            // Log event in lead timeline
            await supabase.from('lead_timeline_events' as any).insert([{
                lead_id: newQuote.lead_id,
                type: 'quote_sent',
                payload: { quote_id: data.id, total: data.total },
                created_by: user?.id
            } as any]);

            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quotes', leadId] });
            queryClient.invalidateQueries({ queryKey: ['lead-timeline', leadId] });
            toast({ title: "Cotação Criada", description: "Orçamento gerado e registrado." });
        }
    });

    return {
        quotes: quotes || [],
        isLoading,
        createQuote
    };
};
