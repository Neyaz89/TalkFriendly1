/**
 * React Query configuration and setup
 * Provides intelligent caching, automatic refetching, and optimistic updates
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache settings
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      gcTime: 1000 * 60 * 30, // 30 minutes - garbage collection time (formerly cacheTime)
      
      // Retry settings
      retry: (failureCount, error: any) => {
        // Don't retry on 401/403 (auth errors)
        if (error?.status === 401 || error?.status === 403) return false;
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch settings
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

/**
 * Query keys for consistent cache management
 */
export const queryKeys = {
  // Authentication
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
  },
  
  // Conversations
  conversations: {
    all: ['conversations'] as const,
    list: (params?: any) => ['conversations', 'list', params] as const,
    detail: (id: string) => ['conversations', 'detail', id] as const,
    unreadCount: ['conversations', 'unread-count'] as const,
  },
  
  // Messages
  messages: {
    all: ['messages'] as const,
    list: (conversationId: string, params?: any) => 
      ['messages', 'list', conversationId, params] as const,
    detail: (id: string) => ['messages', 'detail', id] as const,
  },
  
  // Profile
  profile: {
    current: ['profile', 'current'] as const,
    detail: (id: string) => ['profile', 'detail', id] as const,
    stats: (id: string) => ['profile', 'stats', id] as const,
  },
  
  // Connections
  connections: {
    all: ['connections'] as const,
    list: ['connections', 'list'] as const,
    requests: ['connections', 'requests'] as const,
    search: (query: string) => ['connections', 'search', query] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  
  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'] as const,
    recentActivity: ['dashboard', 'recent-activity'] as const,
  },
  
  // Communities
  communities: {
    all: ['communities'] as const,
    list: ['communities', 'list'] as const,
    detail: (id: string) => ['communities', 'detail', id] as const,
    messages: (id: string, params?: any) => 
      ['communities', 'messages', id, params] as const,
  },
  
  // Listeners
  listeners: {
    all: ['listeners'] as const,
    list: (filters?: any) => ['listeners', 'list', filters] as const,
    detail: (id: string) => ['listeners', 'detail', id] as const,
    availability: (id: string) => ['listeners', 'availability', id] as const,
  },
  
  // Journal
  journal: {
    all: ['journal'] as const,
    list: ['journal', 'list'] as const,
    detail: (id: string) => ['journal', 'detail', id] as const,
  },
  
  // Moods
  moods: {
    all: ['moods'] as const,
    list: ['moods', 'list'] as const,
    history: (days: number) => ['moods', 'history', days] as const,
  },
};

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
  conversations: () => queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all }),
  messages: (conversationId?: string) => {
    if (conversationId) {
      return queryClient.invalidateQueries({ 
        queryKey: ['messages', 'list', conversationId] 
      });
    }
    return queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
  },
  profile: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile.current }),
  notifications: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  connections: () => queryClient.invalidateQueries({ queryKey: queryKeys.connections.all }),
};

/**
 * Clear all caches on logout
 */
export const clearAllCaches = () => {
  queryClient.clear();
};
