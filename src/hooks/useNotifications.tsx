import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { useAuth } from './useAuth';

export type Notification = Tables<'notifications'>;

export const useNotifications = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!userId,
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const createNotification = useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'created_at' | 'user_id'> & { userId?: string }) => {
      const targetUserId = notification.userId || userId;
      if (!targetUserId) throw new Error('User ID is required to create a notification.');

      const { data, error } = await supabase
        .from('notifications')
        .insert([{ ...notification, user_id: targetUserId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (error: Error) => {
      console.error('Error creating notification:', error);
      // Optionally show a toast for internal errors, but not for every notification creation
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId); // Ensure user can only mark their own notifications

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (error: Error) => {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar notificação como lida: " + error.message,
        variant: "destructive",
      });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated.');
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false); // Only update unread ones

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
    onError: (error: Error) => {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar todas as notificações como lidas: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    notifications: notifications || [],
    isLoading,
    error,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
  };
};