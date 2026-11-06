/**
 * Conversation service.
 * Handles 1-to-1 chat conversations.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Conversation,
  ConversationWithParticipant,
  CreateConversationPayload,
  ConversationListParams,
} from '@/types';

export const conversationService = {
  /**
   * Get or create a conversation with another user
   */
  async getOrCreateConversation(payload: CreateConversationPayload): Promise<Conversation> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const userId1 = user.id < payload.participant_id ? user.id : payload.participant_id;
    const userId2 = user.id < payload.participant_id ? payload.participant_id : user.id;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('participant_1_id', userId1)
      .eq('participant_2_id', userId2)
      .maybeSingle();

    if (existing) {
      return existing;
    }

    // Check if users can chat (connected or doctor allows messages)
    const canChat = await this.canChatWith(payload.participant_id);
    if (!canChat) {
      throw new Error('Cannot start conversation with this user');
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_1_id: userId1,
        participant_2_id: userId2,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Get all conversations for the current user
   */
  async getConversations(params?: ConversationListParams): Promise<ConversationWithParticipant[]> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('conversations')
      .select(`
        *,
        participant_1:profiles!conversations_participant_1_id_fkey(
          id, username, full_name, avatar_url, account_type, is_active, last_seen_at
        ),
        participant_2:profiles!conversations_participant_2_id_fkey(
          id, username, full_name, avatar_url, account_type, is_active, last_seen_at
        )
      `)
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    // Pagination
    if (params?.limit) {
      const page = params.page || 1;
      const from = (page - 1) * params.limit;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error in getConversations:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Transform data to include the other participant
    const conversations = await Promise.all(
      data.map(async (conv) => {
        try {
          const otherParticipant = conv.participant_1_id === user.id 
            ? conv.participant_2 
            : conv.participant_1;

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            participant: otherParticipant,
            last_message: lastMessage?.content,
            last_message_at: lastMessage?.created_at || conv.last_message_at,
            unread_count: count || 0,
          } as ConversationWithParticipant;
        } catch (err) {
          console.error('Error processing conversation:', conv.id, err);
          // Return partial data on error
          return {
            ...conv,
            participant: conv.participant_1_id === user.id ? conv.participant_2 : conv.participant_1,
            last_message: undefined,
            unread_count: 0,
          } as ConversationWithParticipant;
        }
      })
    );

    // Apply search filter if provided
    if (params?.search) {
      return conversations.filter(conv => {
        const name = conv.participant?.full_name || conv.participant?.username || '';
        return name.toLowerCase().includes(params.search!.toLowerCase());
      });
    }

    return conversations;
  },

  /**
   * Get a single conversation by ID
   */
  async getConversationById(conversationId: string): Promise<ConversationWithParticipant> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        participant_1:profiles!conversations_participant_1_id_fkey(
          id, username, full_name, avatar_url, account_type, is_active, last_seen_at
        ),
        participant_2:profiles!conversations_participant_2_id_fkey(
          id, username, full_name, avatar_url, account_type, is_active, last_seen_at
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Conversation not found');

    // Verify user is a participant
    if (data.participant_1_id !== user.id && data.participant_2_id !== user.id) {
      throw new Error('Unauthorized');
    }

    const otherParticipant = data.participant_1_id === user.id 
      ? data.participant_2 
      : data.participant_1;

    // Get last message
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get unread count
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    return {
      ...data,
      participant: otherParticipant,
      last_message: lastMessage?.content,
      last_message_at: lastMessage?.created_at || data.last_message_at,
      unread_count: count || 0,
    } as ConversationWithParticipant;
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify user is a participant
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', conversationId)
      .single();

    if (!conv || (conv.participant_1_id !== user.id && conv.participant_2_id !== user.id)) {
      throw new Error('Unauthorized');
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;
  },

  /**
   * Check if current user can chat with another user
   */
  async canChatWith(otherUserId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if blocked
    const { data: blocked } = await supabase.rpc('is_user_blocked', {
      blocker_user_id: otherUserId,
      blocked_user_id: user.id,
    });

    if (blocked) return false;

    const { data: blockedBy } = await supabase.rpc('is_user_blocked', {
      blocker_user_id: user.id,
      blocked_user_id: otherUserId,
    });

    if (blockedBy) return false;

    // Check if connected
    const { data: connected } = await supabase.rpc('are_users_connected', {
      user1_id: user.id,
      user2_id: otherUserId,
    });

    if (connected) return true;

    // Check if other user is a doctor who allows messages
    const { data: doctor } = await supabase
      .from('listeners')
      .select('allow_messages')
      .eq('user_id', otherUserId)
      .eq('is_doctor', true)
      .eq('verification_status', 'verified')
      .maybeSingle();

    return doctor?.allow_messages || false;
  },

  /**
   * Get total unread message count across all conversations
   */
  async getTotalUnreadCount(): Promise<number> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all user's conversations
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_1_id.eq.${user.id},participant_2_id.eq.${user.id}`);

    if (!conversations || conversations.length === 0) return 0;

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    return count || 0;
  },

  /**
   * Subscribe to conversation updates (new conversations or updates to existing ones)
   */
  subscribeToConversations(
    callback: (conversation: ConversationWithParticipant) => void
  ): (() => void) | undefined {
    const supabase = createClient();
    
    // Get current user synchronously from local storage/session
    const userStr = localStorage.getItem('sb-' + process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] + '-auth-token');
    if (!userStr) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        async (payload) => {
          try {
            // Fetch the full conversation with participant details
            const conversationId = payload.new?.id || payload.old?.id;
            if (!conversationId) return;

            const conversation = await conversationService.getConversationById(conversationId as string);
            callback(conversation);
          } catch (error) {
            console.error('Error in conversation subscription:', error);
          }
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
