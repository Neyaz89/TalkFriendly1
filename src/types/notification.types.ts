/**
 * Notification related TypeScript types.
 */

import type { Database } from './database.types';

export type Notification = Database['public']['Tables']['notifications']['Row'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

export type NotificationType = 
  | 'connection_request' 
  | 'connection_accepted' 
  | 'message' 
  | 'comment' 
  | 'like' 
  | 'mention' 
  | 'review' 
  | 'system';

export interface NotificationData {
  connection_id?: string;
  user_id?: string;
  post_id?: string;
  message_id?: string;
  conversation_id?: string;
  comment_id?: string;
  review_id?: string;
  [key: string]: any;
}

export interface CreateNotificationPayload {
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  link?: string;
}

export interface NotificationListParams {
  page?: number;
  limit?: number;
  is_read?: boolean;
  notification_type?: NotificationType;
}
