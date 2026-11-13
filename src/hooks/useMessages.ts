/**
 * Custom hook for managing messages with React Query
 * Provides intelligent caching, pagination, optimistic updates, and real-time sync
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { chatService } from '@/services/chat.service';
import { queryKeys, invalidateQueries } from '@/lib/react-query';
import type { 
  MessageWithSender, 
  SendMessagePayload,
  MessageListParams,
  MarkMessagesReadPayload 
} from '@/types/chat.types';
import { useEffect } from 'react';

/**
 * Get messages for a conversation with caching
 * Uses regular pagination for simpler use case
 */
export function useMessages(conversationId: string | null, params?: Omit<MessageListParams, 'conversation_id'>) {
  return useQuery({
    queryKey: queryKeys.messages.list(conversationId || '', params),
    queryFn: () => chatService.getMessages({ 
      conversation_id: conversationId!,
      ...params 
    }),
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 3, // 3 minutes
    placeholderData: (previousData) => previousData, // Keep old data while fetching
  });
}

/**
 * Get messages with infinite scroll/pagination support
 * Better for loading older messages on demand
 */
export function useInfiniteMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.list(conversationId || '', { infinite: true }),
    queryFn: ({ pageParam }) => chatService.getMessages({
      conversation_id: conversationId!,
      before: pageParam,
      limit: 50,
    }),
    enabled: !!conversationId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Return the ID of the oldest message as the cursor
      if (lastPage && lastPage.length > 0) {
        return lastPage[0].id;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

/**
 * Send a message with optimistic updates
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => chatService.sendMessage(payload),
    
    onMutate: async (payload) => {
      // Cancel any outgoing refetches
      const queryKey = queryKeys.messages.list(payload.conversation_id);
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous messages
      const previousMessages = queryClient.getQueryData<MessageWithSender[]>(queryKey);

      // Create optimistic message
      const optimisticMessage: MessageWithSender = {
        id: `temp-${Date.now()}`,
        conversation_id: payload.conversation_id,
        sender_id: 'current-user', // Will be replaced with actual user ID
        content: payload.content || null,
        message_type: payload.message_type || 'text',
        voice_url: payload.voice_url || null,
        voice_duration: payload.voice_duration || null,
        is_read: false,
        read_at: null,
        is_edited: false,
        is_deleted: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: undefined, // Will be populated from user context
      };

      // Optimistically update the cache
      queryClient.setQueryData<MessageWithSender[]>(
        queryKey,
        (old) => [...(old || []), optimisticMessage]
      );

      return { previousMessages, optimisticMessage };
    },

    onError: (_error, payload, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.list(payload.conversation_id),
          context.previousMessages
        );
      }
    },

    onSuccess: (data, payload) => {
      // Replace optimistic message with real one
      const queryKey = queryKeys.messages.list(payload.conversation_id);
      
      queryClient.setQueryData<MessageWithSender[]>(
        queryKey,
        (old) => {
          if (!old) return [data as any];
          
          // Remove optimistic messages and add real one if not already present
          const filtered = old.filter((m) => !m.id.startsWith('temp-'));
          const exists = filtered.find((m) => m.id === data.id);
          
          return exists ? filtered : [...filtered, data as any];
        }
      );

      // Update conversation list to reflect new message
      invalidateQueries.conversations();
    },
  });
}

/**
 * Mark messages as read
 */
export function useMarkMessagesRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MarkMessagesReadPayload) => chatService.markAsRead(payload),
    
    onSuccess: (_data, payload) => {
      // Update messages cache
      const queryKey = queryKeys.messages.list(payload.conversation_id);
      
      queryClient.setQueryData<MessageWithSender[]>(
        queryKey,
        (old) => old?.map((m) => ({ ...m, is_read: true })) ?? []
      );

      // Update unread count
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.conversations.unreadCount 
      });

      // Update conversation to reflect read status
      invalidateQueries.conversations();
    },
  });
}

/**
 * Delete a message
 */
export function useDeleteMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => chatService.deleteMessage(messageId),
    
    onMutate: async (messageId) => {
      const queryKey = queryKeys.messages.list(conversationId);
      await queryClient.cancelQueries({ queryKey });

      const previousMessages = queryClient.getQueryData<MessageWithSender[]>(queryKey);

      // Optimistically mark as deleted
      queryClient.setQueryData<MessageWithSender[]>(
        queryKey,
        (old) => old?.map((m) => 
          m.id === messageId 
            ? { ...m, is_deleted: true, content: '[deleted]' }
            : m
        ) ?? []
      );

      return { previousMessages };
    },

    onError: (_error, _messageId, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.list(conversationId),
          context.previousMessages
        );
      }
    },

    onSettled: () => {
      invalidateQueries.messages(conversationId);
    },
  });
}

/**
 * Subscribe to real-time message updates for a conversation
 */
export function useMessageSubscription(conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = chatService.subscribeToConversation(
      conversationId,
      (newMessage) => {
        const queryKey = queryKeys.messages.list(conversationId);

        queryClient.setQueryData<MessageWithSender[]>(
          queryKey,
          (old) => {
            if (!old) return [newMessage as any];
            
            // Check if message already exists (avoid duplicates)
            const exists = old.find((m) => m.id === newMessage.id);
            if (exists) return old;
            
            // Add new message to the end
            return [...old, newMessage as any];
          }
        );

        // Update conversation's last message
        invalidateQueries.conversations();
        
        // Update unread count
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.conversations.unreadCount 
        });
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId, queryClient]);
}
