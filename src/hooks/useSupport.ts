
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAccessContext } from '@/platform/access';
import { useTenantContext } from '@/platform/tenant';

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
    const { accessContext } = useAccessContext();
    const { currentOrgId } = useTenantContext();
    const userId = accessContext?.userId ?? null;
    const hasTenantWideAccess =
        accessContext?.role === 'CONNECT_SUPER_ADMIN' ||
        accessContext?.role === 'CONNECT_ADMIN' ||
        accessContext?.role === 'CLIENT_ADMIN';

    const getScopedUserIds = async (): Promise<string[]> => {
        if (!userId) return [];

        if (!hasTenantWideAccess) {
            return [userId];
        }

        if (!currentOrgId) {
            return [userId];
        }

        const { data, error } = await supabase
            .from('org_members')
            .select('user_id')
            .eq('org_id', currentOrgId);

        if (error) throw error;

        return Array.from(new Set([userId, ...(data?.map((row) => row.user_id) ?? [])]));
    };

    // --- Tickets ---

    const useTickets = () => {
        return useQuery({
            queryKey: ['tickets', currentOrgId, userId, accessContext?.role],
            queryFn: async () => {
                if (!userId) return [];
                const scopedUserIds = await getScopedUserIds();
                if (!scopedUserIds.length) return [];

                const { data, error } = await supabase
                    .from('tickets')
                    .select('*')
                    .in('user_id', scopedUserIds)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as Ticket[];
            },
            enabled: !!userId,
        });
    };

    const useTicket = (id: string | undefined) => {
        return useQuery({
            queryKey: ['ticket', id, currentOrgId, userId, accessContext?.role],
            queryFn: async () => {
                if (!id || !userId) return null;
                const scopedUserIds = await getScopedUserIds();
                if (!scopedUserIds.length) return null;

                const { data, error } = await supabase
                    .from('tickets')
                    .select('*')
                    .eq('id', id)
                    .in('user_id', scopedUserIds)
                    .maybeSingle();

                if (error) throw error;
                return data as Ticket | null;
            },
            enabled: !!id && !!userId,
        });
    };

    const createTicket = useMutation({
        mutationFn: async (ticket: Pick<Ticket, 'title' | 'description' | 'category' | 'severity'>) => {
            if (!userId) throw new Error('User context required');

            const { data, error } = await supabase
                .from('tickets')
                .insert([{ ...ticket, user_id: userId }])
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
            queryKey: ['ticket_comments', ticketId, currentOrgId, userId, accessContext?.role],
            queryFn: async () => {
                if (!ticketId || !userId) return [];
                const scopedUserIds = await getScopedUserIds();
                if (!scopedUserIds.length) return [];

                const { data: ticketAccess, error: ticketAccessError } = await supabase
                    .from('tickets')
                    .select('id')
                    .eq('id', ticketId)
                    .in('user_id', scopedUserIds)
                    .maybeSingle();

                if (ticketAccessError) throw ticketAccessError;
                if (!ticketAccess) return [];

                const { data, error } = await supabase
                    .from('ticket_comments')
                    .select('*')
                    .eq('ticket_id', ticketId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                return data as Comment[];
            },
            enabled: !!ticketId && !!userId,
        });
    };

    const createTicketComment = useMutation({
        mutationFn: async ({ ticketId, content }: { ticketId: string; content: string }) => {
            if (!userId) throw new Error('User context required');
            const scopedUserIds = await getScopedUserIds();
            if (!scopedUserIds.length) throw new Error('No tenant scope available');

            const { data: ticketAccess, error: ticketAccessError } = await supabase
                .from('tickets')
                .select('id')
                .eq('id', ticketId)
                .in('user_id', scopedUserIds)
                .maybeSingle();

            if (ticketAccessError) throw ticketAccessError;
            if (!ticketAccess) throw new Error('Ticket access denied');

            const { data, error } = await supabase
                .from('ticket_comments')
                .insert([{ ticket_id: ticketId, content, user_id: userId }])
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
            queryKey: ['ideas', currentOrgId, userId, accessContext?.role],
            queryFn: async () => {
                if (!userId) return [];
                const scopedUserIds = await getScopedUserIds();
                if (!scopedUserIds.length) return [];

                const { data, error } = await supabase
                    .from('ideas')
                    .select('*')
                    .in('user_id', scopedUserIds)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as Idea[];
            },
            enabled: !!userId,
        });
    };

    const useIdea = (id: string | undefined) => {
        return useQuery({
            queryKey: ['idea', id, currentOrgId, userId, accessContext?.role],
            queryFn: async () => {
                if (!id || !userId) return null;
                const scopedUserIds = await getScopedUserIds();
                if (!scopedUserIds.length) return null;

                const { data, error } = await supabase
                    .from('ideas')
                    .select('*')
                    .eq('id', id)
                    .in('user_id', scopedUserIds)
                    .maybeSingle();

                if (error) throw error;
                return data as Idea | null;
            },
            enabled: !!id && !!userId,
        });
    };

    const createIdea = useMutation({
        mutationFn: async (idea: Pick<Idea, 'title' | 'description'>) => {
            if (!userId) throw new Error('User context required');

            const { data, error } = await supabase
                .from('ideas')
                .insert([{ ...idea, user_id: userId }])
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
            queryKey: ['idea_comments', ideaId, currentOrgId, userId, accessContext?.role],
            queryFn: async () => {
                if (!ideaId || !userId) return [];
                const scopedUserIds = await getScopedUserIds();
                if (!scopedUserIds.length) return [];

                const { data: ideaAccess, error: ideaAccessError } = await supabase
                    .from('ideas')
                    .select('id')
                    .eq('id', ideaId)
                    .in('user_id', scopedUserIds)
                    .maybeSingle();

                if (ideaAccessError) throw ideaAccessError;
                if (!ideaAccess) return [];

                const { data, error } = await supabase
                    .from('idea_comments')
                    .select('*')
                    .eq('idea_id', ideaId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                return data as Comment[];
            },
            enabled: !!ideaId && !!userId,
        });
    };

    const createIdeaComment = useMutation({
        mutationFn: async ({ ideaId, content }: { ideaId: string; content: string }) => {
            if (!userId) throw new Error('User context required');
            const scopedUserIds = await getScopedUserIds();
            if (!scopedUserIds.length) throw new Error('No tenant scope available');

            const { data: ideaAccess, error: ideaAccessError } = await supabase
                .from('ideas')
                .select('id')
                .eq('id', ideaId)
                .in('user_id', scopedUserIds)
                .maybeSingle();

            if (ideaAccessError) throw ideaAccessError;
            if (!ideaAccess) throw new Error('Idea access denied');

            const { data, error } = await supabase
                .from('idea_comments')
                .insert([{ idea_id: ideaId, content, user_id: userId }])
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
            queryKey: ['is_hostconnect_staff', userId, accessContext?.role],
            queryFn: async () => !!hasTenantWideAccess,
            enabled: !!userId,
        });
    };

    const updateTicket = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Ticket> }) => {
            if (!userId) throw new Error('User context required');
            const scopedUserIds = await getScopedUserIds();
            if (!scopedUserIds.length) throw new Error('No tenant scope available');

            const { data, error } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', id)
                .in('user_id', scopedUserIds)
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
            if (!userId) throw new Error('User context required');
            const scopedUserIds = await getScopedUserIds();
            if (!scopedUserIds.length) throw new Error('No tenant scope available');

            const { data, error } = await supabase
                .from('ideas')
                .update(updates)
                .eq('id', id)
                .in('user_id', scopedUserIds)
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
