/**
 * Chat conversation and message related TypeScript types.
 */

import type { Database } from './database.types';

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export interface ConversationWithParticipant extends Conversation {
  participant?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    account_type: string;
    is_active: boolean;
    last_seen_at: string;
  };
  last_message?: Message;
  unread_count?: number;
}

export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

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
