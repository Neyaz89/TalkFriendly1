/**
 * Messaging Service
 * Handles real-time messaging between connected users
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type {
  Message,
  MessageWithSender,
  Conversation,
  ConversationWithDetails,
  ConversationsListResponse,
  MessagesListResponse,
  SendMessagePayload,
  MessagesFilterParams,
} from '@/types';

export const messagingService = {
  /**
   * Get all conversations for current user
   */
  async getConversations(
    useServerClient: boolean = false
  ): Promise<ConversationsListResponse> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error, count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      throw new Error(`Failed to fetch conversations: ${error.message}`);
    }

    // Get other participant details and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      (data || []).map(async (conv: Conversation) => {
        const otherParticipantId =
          conv.participant_1_id === user.id
            ? conv.participant_2_id
            : conv.participant_1_id;

        const { data: otherUser } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, profession')
          .eq('id', otherParticipantId)
          .single();

        const unreadCount =
          conv.participant_1_id === user.id
            ? conv.participant_1_unread_count
            : conv.participant_2_unread_count;

        return {
          ...conv,
          other_participant: otherUser,
          unread_count: unreadCount,
        } as ConversationWithDetails;
      })
    );

    const totalUnread = conversationsWithDetails.reduce(
      (sum, conv) => sum + conv.unread_count,
      0
    );

    return {
      conversations: conversationsWithDetails,
      total: count || 0,
      total_unread: totalUnread,
    };
  },

  /**
   * Get or create conversation with a user
   */
  async getOrCreateConversation(
    otherUserId: string,
    useServerClient: boolean = false
  ): Promise<ConversationWithDetails> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check if users are connected
    const { data: connection } = await supabase
      .from('user_connections')
      .select('*')
      .eq('status', 'accepted')
      .or(
        `and(user_id.eq.${user.id},connected_user_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},connected_user_id.eq.${user.id})`
      )
      .single();

    if (!connection) {
      throw new Error('Users must be connected to start a conversation');
    }

    // Use database function to get or create conversation
    const { data: conversationId, error } = await supabase.rpc(
      'get_or_create_conversation',
      {
        p_user1_id: user.id,
        p_user2_id: otherUserId,
      }
    );

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    // Get conversation details
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Get other participant
    const { data: otherUser } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, profession')
      .eq('id', otherUserId)
      .single();

    const unreadCount =
      conversation.participant_1_id === user.id
        ? conversation.participant_1_unread_count
        : conversation.participant_2_unread_count;

    return {
      ...conversation,
      other_participant: otherUser,
      unread_count: unreadCount,
    } as ConversationWithDetails;
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(
    filters: MessagesFilterParams,
    useServerClient: boolean = false
  ): Promise<MessagesListResponse> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get conversation details
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', filters.conversation_id)
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .single();

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    let query = supabase
      .from('messages')
      .select(
        `
        *,
        sender:profiles!sender_id(id, username, full_name, avatar_url)
      `,
        { count: 'exact' }
      )
      .eq('conversation_id', filters.conversation_id)
      .eq('is_deleted', false);

    // Pagination with cursor
    if (filters.before) {
      const { data: beforeMessage } = await supabase
        .from('messages')
        .select('created_at')
        .eq('id', filters.before)
        .single();

      if (beforeMessage) {
        query = query.lt('created_at', beforeMessage.created_at);
      }
    }

    const limit = filters.limit || 50;
    query = query.order('created_at', { ascending: false }).limit(limit);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    // Get other participant
    const otherParticipantId =
      conversation.participant_1_id === user.id
        ? conversation.participant_2_id
        : conversation.participant_1_id;

    const { data: otherUser } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, profession')
      .eq('id', otherParticipantId)
      .single();

    const unreadCount =
      conversation.participant_1_id === user.id
        ? conversation.participant_1_unread_count
        : conversation.participant_2_unread_count;

    const conversationWithDetails: ConversationWithDetails = {
      ...conversation,
      other_participant: otherUser,
      unread_count: unreadCount,
    };

    // Reverse messages so oldest is first
    const messages = ((data || []) as MessageWithSender[]).reverse();

    return {
      messages,
      conversation: conversationWithDetails,
      total: count || 0,
      has_more: (count || 0) > messages.length,
    };
  },

  /**
   * Send a message
   */
  async sendMessage(
    payload: SendMessagePayload,
    useServerClient: boolean = false
  ): Promise<MessageWithSender> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    let conversationId: string;

    // If conversation_id provided, use it
    if (payload.conversation_id) {
      conversationId = payload.conversation_id;
    } 
    // If receiver_id provided, get or create conversation
    else if (payload.receiver_id) {
      // Check if users are connected
      const { data: connection } = await supabase
        .from('user_connections')
        .select('*')
        .eq('status', 'accepted')
        .or(
          `and(user_id.eq.${user.id},connected_user_id.eq.${payload.receiver_id}),and(user_id.eq.${payload.receiver_id},connected_user_id.eq.${user.id})`
        )
        .single();

      if (!connection) {
        throw new Error('Users must be connected to send messages');
      }

      // Get or create conversation
      const { data: convId } = await supabase.rpc(
        'get_or_create_conversation',
        {
          p_user1_id: user.id,
          p_user2_id: payload.receiver_id,
        }
      );

      conversationId = convId;
    } else {
      throw new Error('Either conversation_id or receiver_id is required');
    }

    // Insert message
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: payload.content,
        message_type: payload.message_type || 'text',
      })
      .select(
        `
        *,
        sender:profiles!sender_id(id, username, full_name, avatar_url)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    return data as MessageWithSender;
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: string,
    useServerClient: boolean = false
  ): Promise<void> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Mark all unread messages in conversation where user is NOT the sender
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id) // Mark messages sent by others
      .eq('is_read', false);

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`);
    }
  },

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    messageId: string,
    useServerClient: boolean = false
  ): Promise<void> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', user.id); // Only sender can delete

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  },

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToConversation(
    conversationId: string,
    onMessage: (message: MessageWithSender) => void
  ) {
    const supabase = createBrowserClient();

    console.log('🔔 Subscribing to conversation:', conversationId);

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
        async (payload) => {
          console.log('📩 New message received:', payload.new);
          
          // Get sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const messageWithSender = {
            ...payload.new,
            sender,
          } as MessageWithSender;

          onMessage(messageWithSender);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔕 Unsubscribing from conversation:', conversationId);
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to all conversations (for notifications)
   */
  subscribeToAllConversations(
    userId: string,
    onNewMessage: (message: MessageWithSender) => void
  ) {
    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`user:${userId}:messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // Filter: messages in conversations where user is a participant but not the sender
        },
        async (payload) => {
          // Check if this message is for this user (not sent by them)
          if (payload.new.sender_id === userId) {
            return; // Skip messages sent by this user
          }

          // Get sender details
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const messageWithSender = {
            ...payload.new,
            sender,
          } as MessageWithSender;

          onNewMessage(messageWithSender);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
