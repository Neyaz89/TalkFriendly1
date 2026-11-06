/**
 * Notification service.
 * Handles user notifications for connections, messages, and other activities.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Notification,
  CreateNotificationPayload,
  NotificationListParams,
} from '@/types';

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(params?: NotificationListParams): Promise<{ notifications: Notification[]; total: number }> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Filter by read status
    if (params?.is_read !== undefined) {
      query = query.eq('is_read', params.is_read);
    }

    // Filter by type
    if (params?.notification_type) {
      query = query.eq('notification_type', params.notification_type);
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      notifications: data || [],
      total: count || 0,
    };
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
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

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  /**
   * Delete all read notifications
   */
  async deleteAllRead(): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .eq('is_read', true);

    if (error) throw error;
  },

  /**
   * Create a notification (usually called by other services)
   */
  async createNotification(payload: CreateNotificationPayload): Promise<Notification> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        notification_type: payload.notification_type,
        title: payload.title,
        message: payload.message,
        data: payload.data || null,
        link: payload.link,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(callback: (notification: Notification) => void): () => void {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            callback(payload.new as Notification);
          }
        )
        .subscribe();

      // Return unsubscribe function
      return () => {
        supabase.removeChannel(channel);
      };
    });

    // Return no-op unsubscribe if user not found
    return () => {};
  },

  /**
   * Get recent notifications (last 5)
   */
  async getRecentNotifications(): Promise<Notification[]> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    return data || [];
  },
};
