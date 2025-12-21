import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Conversation {
    id: string;
    property_id: string;
    provider: 'instagram' | 'facebook';
    external_id: string;
    guest_name: string | null;
    guest_avatar: string | null;
    status: 'open' | 'resolved' | 'pending';
    assigned_to: string | null;
    last_message_at: string;
    created_at: string;
    updated_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    direction: 'in' | 'out';
    text: string;
    created_at: string;
}

export interface CannedResponse {
    id: string;
    property_id: string;
    title: string;
    text: string;
    tags: string[];
}

export const useInbox = (propertyId?: string) => {
    const queryClient = useQueryClient();

    // Fetch all conversations for the property
    const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
        queryKey: ['conversations', propertyId],
        queryFn: async () => {
            if (!propertyId) return [];
            const { data, error } = await supabase
                .from('conversations')
                .select(`
          *,
          assignee:profiles!conversations_assigned_to_fkey(full_name, avatar_url)
        `)
                .eq('property_id', propertyId)
                .order('last_message_at', { ascending: false });

            if (error) throw error;
            return data as any[];
        },
        enabled: !!propertyId
    });

    // Fetch messages for a specific conversation
    const getMessages = (conversationId?: string) => {
        return useQuery({
            queryKey: ['messages', conversationId],
            queryFn: async () => {
                if (!conversationId) return [];
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                return data as Message[];
            },
            enabled: !!conversationId
        });
    };

    // Fetch canned responses
    const { data: cannedResponses = [], isLoading: isLoadingTemplates } = useQuery({
        queryKey: ['canned-responses', propertyId],
        queryFn: async () => {
            if (!propertyId) return [];
            const { data, error } = await supabase
                .from('canned_responses')
                .select('*')
                .eq('property_id', propertyId);

            if (error) throw error;
            return data as CannedResponse[];
        },
        enabled: !!propertyId
    });

    // Mutation to send a message
    const sendMessage = useMutation({
        mutationFn: async ({ conversationId, text }: { conversationId: string, text: string }) => {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    direction: 'out',
                    text
                })
                .select()
                .single();

            if (error) throw error;

            // Update conversation last_message_at
            await supabase
                .from('conversations')
                .update({ last_message_at: new Date().toISOString() })
                .eq('id', conversationId);

            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
    });

    // Mutation to update conversation status
    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: 'open' | 'resolved' | 'pending' }) => {
            const { error } = await supabase
                .from('conversations')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast.success("Status atualizado");
        }
    });

    return {
        conversations,
        cannedResponses,
        isLoading: isLoadingConversations || isLoadingTemplates,
        getMessages,
        sendMessage,
        updateStatus
    };
};
