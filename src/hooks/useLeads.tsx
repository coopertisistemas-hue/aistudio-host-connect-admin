import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'negotiation' | 'won' | 'lost';

export interface ReservationLead {
    id: string;
    property_id: string;
    source: string;
    channel: string | null;
    status: LeadStatus;
    guest_name: string;
    guest_phone: string | null;
    guest_email: string | null;
    check_in_date: string | null;
    check_out_date: string | null;
    adults: number;
    children: number;
    notes: string | null;
    assigned_to: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface LeadTimelineEvent {
    id: string;
    lead_id: string;
    type: string;
    payload: any;
    created_by: string;
    created_at: string;
}

export const useLeads = (propertyId: string) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: leads, isLoading: loadingLeads } = useQuery({
        queryKey: ['leads', propertyId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('reservation_leads' as any)
                .select('*')
                .eq('property_id', propertyId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as ReservationLead[];
        },
        enabled: !!propertyId,
    });

    const createLead = useMutation({
        mutationFn: async (newLead: Omit<ReservationLead, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
            const { data: lead, error } = await supabase
                .from('reservation_leads' as any)
                .insert([{
                    ...newLead,
                    created_by: user?.id
                } as any])
                .select()
                .single();
            if (error) throw error;

            // Log creation
            await supabase.from('lead_timeline_events' as any).insert([{
                lead_id: lead.id,
                type: 'status_change',
                payload: { from: null, to: 'new' },
                created_by: user?.id
            } as any]);

            return lead;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', propertyId] });
            toast({ title: "Lead Criado", description: "Interesse registrado com sucesso." });
        }
    });

    const updateLeadStatus = useMutation({
        mutationFn: async ({ id, status, oldStatus }: { id: string, status: LeadStatus, oldStatus: LeadStatus }) => {
            const { error } = await supabase
                .from('reservation_leads' as any)
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;

            // Log status change
            await supabase.from('lead_timeline_events' as any).insert([{
                lead_id: id,
                type: 'status_change',
                payload: { from: oldStatus, to: status },
                created_by: user?.id
            } as any]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', propertyId] });
            toast({ title: "Status Atualizado", description: "O pipeline foi atualizado." });
        }
    });

    const addTimelineNote = useMutation({
        mutationFn: async ({ lead_id, note }: { lead_id: string, note: string }) => {
            const { error } = await supabase
                .from('lead_timeline_events' as any)
                .insert([{
                    lead_id,
                    type: 'note',
                    payload: { text: note },
                    created_by: user?.id
                } as any]);
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['lead-timeline', variables.lead_id] });
        }
    });

    const convertLeadToBooking = useMutation({
        mutationFn: async ({ lead, room_type_id, total_amount }: { lead: ReservationLead, room_type_id: string, total_amount: number }) => {
            // 1. Create Booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings' as any)
                .insert([{
                    property_id: lead.property_id,
                    guest_name: lead.guest_name,
                    guest_email: lead.guest_email || 'n/a@n/a.com',
                    guest_phone: lead.guest_phone,
                    check_in: lead.check_in_date,
                    check_out: lead.check_out_date,
                    total_guests: lead.adults + lead.children,
                    room_type_id: room_type_id,
                    total_amount: total_amount,
                    status: 'confirmed',
                    lead_id: lead.id
                } as any])
                .select()
                .single();

            if (bookingError) throw bookingError;

            // 2. Update Lead Status
            const { error: leadError } = await supabase
                .from('reservation_leads' as any)
                .update({ status: 'won', updated_at: new Date().toISOString() })
                .eq('id', lead.id);

            if (leadError) throw leadError;

            // 3. Log Event
            await supabase.from('lead_timeline_events' as any).insert([{
                lead_id: lead.id,
                type: 'status_change',
                payload: { from: lead.status, to: 'won', booking_id: booking.id },
                created_by: user?.id
            } as any]);

            return booking;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads', propertyId] });
            queryClient.invalidateQueries({ queryKey: ['bookings', propertyId] });
            toast({ title: "Reserva Confirmada", description: "O lead foi convertido com sucesso!" });
        }
    });

    return {
        leads: leads || [],
        isLoading: loadingLeads,
        createLead,
        updateLeadStatus,
        addTimelineNote,
        convertLeadToBooking
    };
};

export const useLeadTimeline = (leadId: string) => {
    return useQuery({
        queryKey: ['lead-timeline', leadId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('lead_timeline_events' as any)
                .select('*, profiles:created_by(full_name)')
                .eq('lead_id', leadId)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as any[];
        },
        enabled: !!leadId,
    });
};
