/**
 * Types for Connections and Messaging System
 */

import type { Database } from './database.types';

// ============================================================================
// Connection Types
// ============================================================================

export type UserConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface UserConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: UserConnectionStatus;
  initiated_by: string;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
}

export interface UserConnectionWithProfile extends UserConnection {
  connected_user: {
    id: string;
    username: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
    profession: string | null;
    bio: string | null;
  };
}

export interface ConnectionRequestResponse {
  id: string;
  from_user: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    profession: string | null;
  };
  status: UserConnectionStatus;
  created_at: string;
}

// ============================================================================
// Conversation and Message Types (using database types as base)
// ============================================================================

// Base types from database
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

// Extended conversation type with participant details for messaging UI
export interface ConversationWithDetails extends Conversation {
  other_participant: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    profession: string | null;
    account_type?: 'user' | 'listener' | 'doctor' | 'admin';
    is_verified?: boolean;
  };
  unread_count: number; // For current user
}

// Extended message type with sender details for messaging UI
export interface MessageWithSender extends Message {
  sender: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    account_type?: 'user' | 'listener' | 'doctor' | 'admin';
    is_verified?: boolean;
  };
}

// ============================================================================
// API Payloads
// ============================================================================

export interface UserSendConnectionPayload {
  target_user_id: string;
}

export interface RespondToConnectionPayload {
  connection_id: string;
  status: 'accepted' | 'rejected';
}

export interface SendMessagePayload {
  conversation_id?: string;
  receiver_id?: string; // Either this or conversation_id
  content?: string | null;
  message_type?: 'text' | 'voice' | 'image' | 'file' | 'system' | 'support_form_request' | 'feedback_request';
  voice_url?: string | null;
  voice_duration?: number | null;
}

export interface MarkMessagesAsReadPayload {
  message_ids: string[];
}

// ============================================================================
// API Responses
// ============================================================================

export interface ConnectionsListResponse {
  connections: UserConnectionWithProfile[];
  total: number;
  pending_requests_count: number;
}

export interface ConnectionRequestsResponse {
  requests: ConnectionRequestResponse[];
  total: number;
}

export interface ConversationsListResponse {
  conversations: ConversationWithDetails[];
  total: number;
  total_unread: number;
}

export interface MessagesListResponse {
  messages: MessageWithSender[];
  conversation: ConversationWithDetails;
  total: number;
  has_more: boolean;
}

export interface SendMessageResponse {
  message: MessageWithSender;
  conversation: ConversationWithDetails;
}

// ============================================================================
// Filter/Query Types
// ============================================================================

export interface ConnectionsFilterParams {
  status?: UserConnectionStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MessagesFilterParams {
  conversation_id: string;
  before?: string; // message ID for pagination
  limit?: number;
}

// ============================================================================
// User Profile for Connections
// ============================================================================

export interface UserProfileCard {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: 'user' | 'listener' | 'admin';
  bio: string | null;
  created_at: string;
  
  // Connection status with current user
  connection_status: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';
  connection_id: string | null;
  
  // Stats (optional)
  stats?: {
    total_connections: number;
    listener_rating?: number;
    total_sessions?: number;
  };
}

// ============================================================================
// Real-time Event Types
// ============================================================================

export type ConnectionEventType = 
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_rejected'
  | 'connection_removed';

export type MessageEventType =
  | 'new_message'
  | 'message_read'
  | 'message_deleted'
  | 'message_edited'
  | 'typing_start'
  | 'typing_stop';

export interface ConnectionEvent {
  type: ConnectionEventType;
  connection: UserConnectionWithProfile;
  timestamp: string;
}

export interface MessageEvent {
  type: MessageEventType;
  message?: MessageWithSender;
  conversation_id: string;
  user_id: string;
  timestamp: string;
}
