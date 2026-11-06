/**
 * Chat service.
 * Handles sending, receiving, and managing chat messages including voice messages.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Message,
  MessageWithSender,
  SendMessagePayload,
  MessageListParams,
  MarkMessagesReadPayload,
  VoiceMessageUpload,
} from '@/types/chat.types';

export const chatService = {
  /**
   * Send a text or voice message
   */
  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify user is a participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', payload.conversation_id)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (conversation.participant_1_id !== user.id && conversation.participant_2_id !== user.id) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: payload.conversation_id,
        sender_id: user.id,
        content: payload.content,
        message_type: payload.message_type || 'text',
        voice_url: payload.voice_url,
        voice_duration: payload.voice_duration,
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification to other participant
    const recipientId = conversation.participant_1_id === user.id 
      ? conversation.participant_2_id 
      : conversation.participant_1_id;

    await supabase.from('notifications').insert({
      user_id: recipientId,
      notification_type: 'message',
      title: 'New Message',
      message: payload.message_type === 'voice' ? 'Sent a voice message' : payload.content || 'Sent a message',
      data: { conversation_id: payload.conversation_id, message_id: data.id },
      link: `/chat/${payload.conversation_id}`,
    });

    return data;
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(params: MessageListParams): Promise<MessageWithSender[]> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(
          id, username, full_name, avatar_url
        )
      `)
      .eq('conversation_id', params.conversation_id)
      .eq('is_deleted', false);

    // Pagination with cursor
    if (params.before) {
      query = query.lt('id', params.before);
    }

    const limit = params.limit || 50;
    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error } = await query;

    if (error) throw error;

    // Reverse to show oldest first
    return ((data || []) as MessageWithSender[]).reverse();
  },

  /**
   * Mark messages as read
   */
  async markAsRead(payload: MarkMessagesReadPayload): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', payload.conversation_id)
      .neq('sender_id', user.id);

    if (payload.message_ids && payload.message_ids.length > 0) {
      query = query.in('id', payload.message_ids);
    }

    const { error } = await query;

    if (error) throw error;
  },

  /**
   * Upload a voice message file
   */
  async uploadVoiceMessage(
    conversationId: string,
    voiceData: VoiceMessageUpload
  ): Promise<string> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${user.id}/${conversationId}/${timestamp}.webm`;

    // Upload to storage
    const { data, error } = await supabase.storage
      .from('chat-voice-messages')
      .upload(fileName, voiceData.blob, {
        contentType: 'audio/webm',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    return data.path;
  },

  /**
   * Get signed URL for voice message playback
   */
  async getVoiceMessageUrl(voicePath: string): Promise<string> {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from('chat-voice-messages')
      .createSignedUrl(voicePath, 3600); // 1 hour expiry

    if (error) throw error;

    return data.signedUrl;
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        content: '[deleted]',
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', user.id);

    if (error) throw error;
  },

  /**
   * Edit a text message
   */
  async editMessage(messageId: string, content: string): Promise<Message> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', user.id)
      .eq('message_type', 'text')
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Subscribe to new messages in a conversation (for real-time updates)
   */
  subscribeToConversation(
    conversationId: string,
    callback: (message: Message) => void
  ): () => void {
    const supabase = createClient();

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string): Promise<MessageWithSender> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(
          id, username, full_name, avatar_url
        )
      `)
      .eq('id', messageId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Message not found');

    return data as MessageWithSender;
  },

  /**
   * Search messages in a conversation
   */
  async searchMessages(conversationId: string, searchTerm: string): Promise<MessageWithSender[]> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(
          id, username, full_name, avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .eq('message_type', 'text')
      .eq('is_deleted', false)
      .ilike('content', `%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data || []) as MessageWithSender[];
  },
};
