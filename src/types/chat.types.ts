/**
 * Chat conversation and message related TypeScript types.
 * Used by the legacy chat feature (features/chat).
 * For the newer messaging system, see connections.types.ts.
 */

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface ChatConversation {
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

// Alias for backward compatibility
export type Conversation = ChatConversation;

export type ConversationInsert = Omit<ChatConversation, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ConversationUpdate = Partial<ConversationInsert>;

export interface ConversationWithParticipant extends ChatConversation {
  participant?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    account_type: string;
    is_active: boolean;
    last_seen_at: string;
  };
  last_message?: string | null;
  unread_count?: number;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'voice' | 'image' | 'file' | 'system';
  voice_url: string | null;
  voice_duration: number | null;
  is_read: boolean;
  read_at: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Alias for backward compatibility
export type Message = ChatMessage;

export type MessageInsert = Omit<ChatMessage, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type MessageUpdate = Partial<MessageInsert>;

export interface MessageWithSender extends ChatMessage {
  sender?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateConversationPayload {
  participant_id: string;
}

export interface SendMessagePayload {
  conversation_id: string;
  content?: string;
  message_type?: 'text' | 'voice' | 'system';
  voice_url?: string;
  voice_duration?: number;
}

export interface VoiceMessageUpload {
  blob: Blob;
  duration: number;
}

export interface MarkMessagesReadPayload {
  conversation_id: string;
  message_ids?: string[];
}

export interface ConversationListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface MessageListParams {
  conversation_id: string;
  before?: string; // message_id for pagination
  limit?: number;
}
