/**
 * Types for Connections and Messaging System
 */

// ============================================================================
// Connection Types
// ============================================================================

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface UserConnection {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: ConnectionStatus;
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

export interface ConnectionRequest {
  id: string;
  from_user: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    profession: string | null;
  };
  status: ConnectionStatus;
  created_at: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  participant_1_unread_count: number;
  participant_2_unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
  other_participant: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    profession: string | null;
  };
  unread_count: number; // For current user
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageType = 'text' | 'image' | 'file' | 'system';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  read_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// ============================================================================
// API Payloads
// ============================================================================

export interface SendConnectionRequestPayload {
  target_user_id: string;
}

export interface RespondToConnectionPayload {
  connection_id: string;
  status: 'accepted' | 'rejected';
}

export interface SendMessagePayload {
  conversation_id?: string;
  receiver_id?: string; // Either this or conversation_id
  content: string;
  message_type?: MessageType;
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
  requests: ConnectionRequest[];
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
  status?: ConnectionStatus;
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
