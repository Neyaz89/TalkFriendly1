/**
 * Custom hook for managing conversations with React Query
 * Provides caching, optimistic updates, and real-time synchronization
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationService } from '@/services/conversation.service';
import { queryKeys, invalidateQueries } from '@/lib/react-query';
import type { ConversationWithParticipant, CreateConversationPayload } from '@/types/chat.types';
import { useEffect } from 'react';

/**
 * Get all conversations for the current user with caching
 */
export function useConversations(params?: any) {
  return useQuery({
    queryKey: queryKeys.conversations.list(params),
    queryFn: () => conversationService.getConversations(params),
    staleTime: 1000 * 60 * 2, // 2 minutes - conversations change less frequently
  });
}

/**
 * Get a single conversation by ID with caching
 */
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId || ''),
    queryFn: () => conversationService.getConversationById(conversationId!),
    enabled: !!conversationId, // Only fetch when ID is available
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get total unread message count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.conversations.unreadCount,
    queryFn: () => conversationService.getTotalUnreadCount(),
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
    staleTime: 1000 * 20, // 20 seconds
  });
}

/**
 * Create or get existing conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConversationPayload) => 
      conversationService.getOrCreateConversation(payload),
    onSuccess: () => {
      // Invalidate conversations list to show the new conversation
      invalidateQueries.conversations();
    },
  });
}

/**
 * Delete a conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => 
      conversationService.deleteConversation(conversationId),
    onMutate: async (conversationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations.all });

      // Snapshot previous value
      const previousConversations = queryClient.getQueryData(
        queryKeys.conversations.list()
      );

      // Optimistically remove conversation from cache
      queryClient.setQueryData<ConversationWithParticipant[]>(
        queryKeys.conversations.list(),
        (old) => old?.filter((c) => c.id !== conversationId) ?? []
      );

      return { previousConversations };
    },
    onError: (_error, _conversationId, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(
          queryKeys.conversations.list(),
          context.previousConversations
        );
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      invalidateQueries.conversations();
    },
  });
}

/**
 * Subscribe to real-time conversation updates
 */
export function useConversationSubscription() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = conversationService.subscribeToConversations(
      (updatedConversation) => {
        // Update the conversation in the cache
        queryClient.setQueryData<ConversationWithParticipant[]>(
          queryKeys.conversations.list(),
          (old) => {
            if (!old) return [updatedConversation];
            
            const exists = old.find((c) => c.id === updatedConversation.id);
            if (exists) {
              // Update existing conversation
              return old.map((c) =>
                c.id === updatedConversation.id ? updatedConversation : c
              );
            } else {
              // Add new conversation
              return [updatedConversation, ...old];
            }
          }
        );

        // Also update the detail cache if it exists
        queryClient.setQueryData(
          queryKeys.conversations.detail(updatedConversation.id),
          updatedConversation
        );

        // Update unread count
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.conversations.unreadCount 
        });
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [queryClient]);
}
