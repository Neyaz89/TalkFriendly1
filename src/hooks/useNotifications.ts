/**
 * Notification hooks with React Query caching
 * Manages user notifications and unread counts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import { createClient } from '@/lib/supabase/client';

/**
 * Get all notifications for current user
 */
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30, // 30 seconds - notifications need to be fresher
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Get unread notification count
 */
export function useUnreadNotificationsCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    },
    staleTime: 1000 * 20, // 20 seconds
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
}

/**
 * Mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return notificationId;
    },
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(queryKeys.notifications.list);

      // Optimistically mark as read
      queryClient.setQueryData(queryKeys.notifications.list, (old: any[]) =>
        old?.map((notif: any) =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        ) ?? []
      );

      // Update unread count
      queryClient.setQueryData(queryKeys.notifications.unreadCount, (old: number) =>
        Math.max(0, (old || 0) - 1)
      );

      return { previousNotifications };
    },
    onError: (_error, _notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list, context.previousNotifications);
      }
      // Refetch unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(queryKeys.notifications.list);

      // Optimistically mark all as read
      queryClient.setQueryData(queryKeys.notifications.list, (old: any[]) =>
        old?.map((notif: any) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        })) ?? []
      );

      // Set unread count to 0
      queryClient.setQueryData(queryKeys.notifications.unreadCount, 0);

      return { previousNotifications };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list, context.previousNotifications);
      }
      // Refetch unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}

/**
 * Delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return notificationId;
    },
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.list });

      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData(queryKeys.notifications.list);

      // Check if notification was unread
      const notifications = queryClient.getQueryData<any[]>(queryKeys.notifications.list);
      const wasUnread = notifications?.find((n: any) => n.id === notificationId && !n.is_read);

      // Optimistically remove
      queryClient.setQueryData(queryKeys.notifications.list, (old: any[]) =>
        old?.filter((notif: any) => notif.id !== notificationId) ?? []
      );

      // Update unread count if it was unread
      if (wasUnread) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount, (old: number) =>
          Math.max(0, (old || 0) - 1)
        );
      }

      return { previousNotifications, wasUnread };
    },
    onError: (_error, _notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications.list, context.previousNotifications);
      }
      // Refetch unread count
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount });
    },
  });
}
