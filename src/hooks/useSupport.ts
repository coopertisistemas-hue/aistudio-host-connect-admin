
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Ticket = {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'bug' | 'billing' | 'general';
    created_at: string;
    updated_at: string;
    user_id: string;
};

export type Idea = {
    id: string;
    title: string;
    description: string;
    status: 'under_review' | 'planned' | 'in_progress' | 'completed' | 'declined';
    votes: number;
    created_at: string;
    updated_at: string;
};

export type Comment = {
    id: string;
    content: string;
    is_staff_reply: boolean;
    created_at: string;
    user_id: string;
};

export const useSupport = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // --- Tickets ---

    const useTickets = () => {
        return useQuery({
            queryKey: ['tickets'],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('tickets')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as Ticket[];
            },
        });
    };

    const useTicket = (id: string | undefined) => {
        return useQuery({
            queryKey: ['ticket', id],
            queryFn: async () => {
                if (!id) return null;
                const { data, error } = await supabase
                    .from('tickets')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                return data as Ticket;
            },
            enabled: !!id,
        });
    };

    const createTicket = useMutation({
        mutationFn: async (ticket: Pick<Ticket, 'title' | 'description' | 'category' | 'severity'>) => {
            const { data, error } = await supabase
                .from('tickets')
                .insert([ticket])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            toast({ title: 'Ticket criado com sucesso!' });
        },
        onError: (error) => {
            toast({ title: 'Erro ao criar ticket', description: error.message, variant: 'destructive' });
        },
    });

    // --- Ticket Comments ---

    const useTicketComments = (ticketId: string | undefined) => {
        return useQuery({
            queryKey: ['ticket_comments', ticketId],
            queryFn: async () => {
                if (!ticketId) return [];
                const { data, error } = await supabase
                    .from('ticket_comments')
                    .select('*')
                    .eq('ticket_id', ticketId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                return data as Comment[];
            },
            enabled: !!ticketId,
        });
    };

    const createTicketComment = useMutation({
        mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
            const { data, error } = await supabase
                .from('ticket_comments')
                .insert([{ ticket_id: ticketId, content }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, { ticketId }) => {
            queryClient.invalidateQueries({ queryKey: ['ticket_comments', ticketId] });
            toast({ title: 'Comentário enviado!' });
        },
        onError: (error) => {
            toast({ title: 'Erro ao enviar comentário', description: error.message, variant: 'destructive' });
        },
    });


    // --- Ideas ---

    const useIdeas = () => {
        return useQuery({
            queryKey: ['ideas'],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('ideas')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as Idea[];
            },
        });
    };

    const useIdea = (id: string | undefined) => {
        return useQuery({
            queryKey: ['idea', id],
            queryFn: async () => {
                if (!id) return null;
                const { data, error } = await supabase
                    .from('ideas')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                return data as Idea;
            },
            enabled: !!id,
        });
    };

    const createIdea = useMutation({
        mutationFn: async (idea: Pick<Idea, 'title' | 'description'>) => {
            const { data, error } = await supabase
                .from('ideas')
                .insert([idea])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ideas'] });
            toast({ title: 'Ideia sugerida com sucesso!' });
        },
        onError: (error) => {
            toast({ title: 'Erro ao sugerir ideia', description: error.message, variant: 'destructive' });
        },
    });

    // --- Idea Comments ---

    const useIdeaComments = (ideaId: string | undefined) => {
        return useQuery({
            queryKey: ['idea_comments', ideaId],
            queryFn: async () => {
                if (!ideaId) return [];
                const { data, error } = await supabase
                    .from('idea_comments')
                    .select('*')
                    .eq('idea_id', ideaId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                return data as Comment[];
            },
            enabled: !!ideaId,
        });
    };

    const createIdeaComment = useMutation({
        mutationFn: async ({ ideaId, content }: { ideaId: string; content: string }) => {
            const { data, error } = await supabase
                .from('idea_comments')
                .insert([{ idea_id: ideaId, content }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, { ideaId }) => {
            queryClient.invalidateQueries({ queryKey: ['idea_comments', ideaId] });
            toast({ title: 'Comentário enviado!' });
        },
        onError: (error) => {
            toast({ title: 'Erro ao enviar comentário', description: error.message, variant: 'destructive' });
        },
    });

    // --- Admin ---

    const useIsStaff = () => {
        return useQuery({
            queryKey: ['is_hostconnect_staff'],
            queryFn: async () => {
                const { data, error } = await supabase.rpc('is_hostconnect_staff');
                if (error) {
                    console.error('Error checking staff status:', error);
                    return false;
                }
                return data as boolean;
            },
        });
    };

    const updateTicket = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Ticket> }) => {
            const { data, error } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['tickets'] });
            queryClient.invalidateQueries({ queryKey: ['ticket', id] });
            toast({ title: 'Ticket atualizado com sucesso!' });
        },
        onError: (error) => {
            toast({ title: 'Erro ao atualizar ticket', description: error.message, variant: 'destructive' });
        }
    });

    const updateIdea = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Idea> }) => {
            const { data, error } = await supabase
                .from('ideas')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['ideas'] });
            queryClient.invalidateQueries({ queryKey: ['idea', id] });
            toast({ title: 'Ideia atualizada com sucesso!' });
        },
        onError: (error) => {
            toast({ title: 'Erro ao atualizar ideia', description: error.message, variant: 'destructive' });
        }
    });

    return {
        useTickets,
        useTicket,
        createTicket,
        useTicketComments,
        createTicketComment,
        useIdeas,
        useIdea,
        createIdea,
        useIdeaComments,
        createIdeaComment,
        useIsStaff,
        updateTicket,
        updateIdea,
    };
};
