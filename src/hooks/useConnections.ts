/**
 * Connection hooks with React Query caching
 * Manages friend connections and connection requests
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService } from '@/services/connection.service';
import { queryKeys, invalidateQueries } from '@/lib/react-query';

/**
 * Get all connections for current user
 */
export function useConnections() {
  return useQuery({
    queryKey: queryKeys.connections.list,
    queryFn: async () => {
      // Assuming connectionService has a getConnections method
      // If not, we'll need to create it
      const response = await fetch('/api/connections/list');
      if (!response.ok) throw new Error('Failed to fetch connections');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get pending connection requests
 */
export function useConnectionRequests() {
  return useQuery({
    queryKey: queryKeys.connections.requests,
    queryFn: async () => {
      const response = await fetch('/api/connections/requests');
      if (!response.ok) throw new Error('Failed to fetch connection requests');
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes - requests are more time-sensitive
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Search for users to connect with
 */
export function useConnectionSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.connections.search(query),
    queryFn: async () => {
      const response = await fetch(`/api/connections/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search users');
      return response.json();
    },
    enabled: query.length >= 2, // Only search when query is at least 2 characters
    staleTime: 1000 * 60 * 3, // 3 minutes
  });
}

/**
 * Send a connection request
 */
export function useSendConnectionRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (receiverId: string) => {
      const response = await fetch('/api/connections/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: receiverId }),
      });
      
      if (!response.ok) throw new Error('Failed to send connection request');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate connection requests to show the new pending request
      invalidateQueries.connections();
    },
  });
}

/**
 * Respond to a connection request (accept/reject)
 */
export function useRespondToConnectionRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'accepted' | 'rejected' }) => {
      const response = await fetch('/api/connections/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, status }),
      });
      
      if (!response.ok) throw new Error('Failed to respond to connection request');
      return response.json();
    },
    onMutate: async ({ requestId, status }) => {
      // Cancel outgoing requests
      await queryClient.cancelQueries({ queryKey: queryKeys.connections.requests });

      // Snapshot previous value
      const previousRequests = queryClient.getQueryData(queryKeys.connections.requests);

      // Optimistically remove the request
      queryClient.setQueryData(queryKeys.connections.requests, (old: any[]) =>
        old?.filter((req: any) => req.id !== requestId) ?? []
      );

      return { previousRequests };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousRequests) {
        queryClient.setQueryData(queryKeys.connections.requests, context.previousRequests);
      }
    },
    onSuccess: () => {
      // Refetch connections and requests
      invalidateQueries.connections();
    },
  });
}

/**
 * Remove a connection
 */
export function useRemoveConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await fetch('/api/connections/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId }),
      });
      
      if (!response.ok) throw new Error('Failed to remove connection');
      return response.json();
    },
    onMutate: async (connectionId) => {
      // Cancel outgoing requests
      await queryClient.cancelQueries({ queryKey: queryKeys.connections.list });

      // Snapshot previous value
      const previousConnections = queryClient.getQueryData(queryKeys.connections.list);

      // Optimistically remove the connection
      queryClient.setQueryData(queryKeys.connections.list, (old: any[]) =>
        old?.filter((conn: any) => conn.id !== connectionId) ?? []
      );

      return { previousConnections };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousConnections) {
        queryClient.setQueryData(queryKeys.connections.list, context.previousConnections);
      }
    },
    onSuccess: () => {
      // Refetch connections
      invalidateQueries.connections();
    },
  });
}
