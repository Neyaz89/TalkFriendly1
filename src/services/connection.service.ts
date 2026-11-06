/**
 * Connection Service
 * Handles user connections (friend/connection requests system)
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import type {
  UserConnection,
  UserConnectionWithProfile,
  ConnectionsListResponse,
  ConnectionsFilterParams,
  UserProfileCard,
} from '@/types';
import type {
  ConnectionRequestResponse,
  ConnectionRequestsResponse,
} from '@/types/connections.types';

export const connectionService = {
  /**
   * Send a connection request to another user
   */
  async sendConnectionRequest(
    targetUserId: string,
    useServerClient: boolean = false
  ): Promise<UserConnection> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from('user_connections')
      .select('*')
      .or(
        `and(user_id.eq.${user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${user.id})`
      )
      .single();

    if (existing) {
      throw new Error('Connection request already exists');
    }

    // Create connection request
    const { data, error } = await supabase
      .from('user_connections')
      .insert({
        user_id: user.id,
        connected_user_id: targetUserId,
        initiated_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to send connection request: ${error.message}`);
    }

    return data as UserConnection;
  },

  /**
   * Respond to a connection request (accept/reject)
   */
  async respondToConnectionRequest(
    connectionId: string,
    status: 'accepted' | 'rejected',
    useServerClient: boolean = false
  ): Promise<UserConnection> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error} = await supabase
      .from('user_connections')
      .update({ status })
      .eq('id', connectionId)
      .eq('connected_user_id', user.id) // Only receiver can respond
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to respond to connection: ${error.message}`);
    }

    return data as UserConnection;
  },

  /**
   * Remove/cancel a connection
   */
  async removeConnection(
    connectionId: string,
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
      .from('user_connections')
      .delete()
      .eq('id', connectionId)
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

    if (error) {
      throw new Error(`Failed to remove connection: ${error.message}`);
    }
  },

  /**
   * Get user's connections list
   */
  async getConnections(
    filters?: ConnectionsFilterParams,
    useServerClient: boolean = false
  ): Promise<ConnectionsListResponse> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Get connections where user is either user_id OR connected_user_id
    let query = supabase
      .from('user_connections')
      .select(
        `
        *,
        user_profile:profiles!user_id(id, username, full_name, email, avatar_url, bio, profession),
        connected_user_profile:profiles!connected_user_id(id, username, full_name, email, avatar_url, bio, profession)
      `,
        { count: 'exact' }
      )
      .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`);

    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'accepted'); // Default: show accepted connections
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch connections: ${error.message}`);
    }

    // Transform data to show the OTHER user's profile
    const transformedConnections = (data || []).map((conn: any) => {
      const isUserInitiator = conn.user_id === user.id;
      const otherUserProfile = isUserInitiator 
        ? conn.connected_user_profile 
        : conn.user_profile;

      return {
        ...conn,
        connected_user: otherUserProfile,
      };
    });

    // Get pending requests count
    const { count: pendingCount } = await supabase
      .from('user_connections')
      .select('*', { count: 'exact', head: true })
      .eq('connected_user_id', user.id)
      .eq('status', 'pending');

    return {
      connections: transformedConnections as UserConnectionWithProfile[],
      total: count || 0,
      pending_requests_count: pendingCount || 0,
    };
  },

  /**
   * Get pending connection requests (received)
   */
  async getConnectionRequests(
    useServerClient: boolean = false
  ): Promise<ConnectionRequestsResponse> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error, count } = await supabase
      .from('user_connections')
      .select(
        `
        id,
        status,
        created_at,
        from_user:profiles!user_id(id, username, full_name, avatar_url, profession)
      `,
        { count: 'exact' }
      )
      .eq('connected_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch connection requests: ${error.message}`);
    }

    return {
      requests: (data || []) as any as ConnectionRequestResponse[],
      total: count || 0,
    };
  },

  /**
   * Check connection status with a specific user
   */
  async getConnectionStatus(
    targetUserId: string,
    useServerClient: boolean = false
  ): Promise<{
    status: 'none' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';
    connection_id: string | null;
  }> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data } = await supabase
      .from('user_connections')
      .select('*')
      .or(
        `and(user_id.eq.${user.id},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${user.id})`
      )
      .single();

    if (!data) {
      return { status: 'none', connection_id: null };
    }

    const connection = data as UserConnection;

    if (connection.status === 'blocked') {
      return { status: 'blocked', connection_id: connection.id };
    }

    if (connection.status === 'accepted') {
      return { status: 'connected', connection_id: connection.id };
    }

    if (connection.status === 'pending') {
      if (connection.user_id === user.id) {
        return { status: 'pending_sent', connection_id: connection.id };
      } else {
        return { status: 'pending_received', connection_id: connection.id };
      }
    }

    return { status: 'none', connection_id: null };
  },

  /**
   * Get user profile with connection status
   */
  async getUserProfile(
    userId: string,
    useServerClient: boolean = false
  ): Promise<UserProfileCard> {
    const supabase = createBrowserClient();

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, email, avatar_url, bio, profession, created_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      throw new Error('User not found');
    }

    // Get connection status
    let connectionStatus: UserProfileCard['connection_status'] = 'none';
    let connectionId: string | null = null;

    if (currentUser) {
      const status = await this.getConnectionStatus(userId, useServerClient);
      connectionStatus = status.status;
      connectionId = status.connection_id;
    }

    // Get stats (optional)
    const { count: connectionsCount } = await supabase
      .from('user_connections')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`);

    return {
      ...profile,
      role: 'user', // Default role since profiles don't have role column
      connection_status: connectionStatus,
      connection_id: connectionId,
      stats: {
        total_connections: connectionsCount || 0,
      },
    } as UserProfileCard;
  },

  /**
   * Search for users to connect with
   */
  async searchUsers(
    searchQuery: string,
    filters?: { role?: string; page?: number; limit?: number },
    useServerClient: boolean = false
  ): Promise<{ users: UserProfileCard[]; total: number }> {
    const supabase = createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    let query = supabase
      .from('profiles')
      .select('id, username, full_name, email, avatar_url, bio, profession, created_at', {
        count: 'exact',
      })
      .neq('id', user.id); // Exclude current user

    // Search by username or full name
    if (searchQuery) {
      query = query.or(
        `username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`
      );
    }

    // Filter by profession (since there's no role column)
    if (filters?.role) {
      query = query.ilike('profession', `%${filters.role}%`);
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    // Get connection status for each user
    const usersWithStatus = await Promise.all(
      (data || []).map(async (profile) => {
        const status = await this.getConnectionStatus(profile.id, useServerClient);
        return {
          ...profile,
          role: 'user', // Default role
          connection_status: status.status,
          connection_id: status.connection_id,
          stats: {
            total_connections: 0,
          },
        } as UserProfileCard;
      })
    );

    return {
      users: usersWithStatus,
      total: count || 0,
    };
  },
};
