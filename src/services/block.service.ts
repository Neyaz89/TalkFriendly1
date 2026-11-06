/**
 * Block service.
 * Handles user blocking functionality for privacy and safety.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  Block,
  BlockWithUser,
  CreateBlockPayload,
  BlockListParams,
} from '@/types';

export const blockService = {
  /**
   * Block a user
   */
  async blockUser(payload: CreateBlockPayload): Promise<Block> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if already blocked
    const { data: existing } = await supabase
      .from('blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', payload.blocked_id)
      .maybeSingle();

    if (existing) {
      throw new Error('User is already blocked');
    }

    const { data, error } = await supabase
      .from('blocks')
      .insert({
        blocker_id: user.id,
        blocked_id: payload.blocked_id,
        reason: payload.reason,
      })
      .select()
      .single();

    if (error) throw error;

    // Remove connection if exists
    await supabase
      .from('connections')
      .delete()
      .or(
        `and(user_id_1.eq.${Math.min(user.id, payload.blocked_id)},user_id_2.eq.${Math.max(user.id, payload.blocked_id)})`
      );

    // Cancel any pending connection requests
    await supabase
      .from('connection_requests')
      .update({ status: 'cancelled' })
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`sender_id.eq.${payload.blocked_id},receiver_id.eq.${payload.blocked_id}`)
      .in('status', ['pending']);

    return data;
  },

  /**
   * Unblock a user
   */
  async unblockUser(blockedUserId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedUserId);

    if (error) throw error;
  },

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(params?: BlockListParams): Promise<{ blocks: BlockWithUser[]; total: number }> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('blocks')
      .select(`
        *,
        blocked_user:profiles!blocked_id(
          id, username, full_name, avatar_url
        )
      `, { count: 'exact' })
      .eq('blocker_id', user.id);

    // Pagination
    if (params?.limit) {
      const page = params.page || 1;
      const from = (page - 1) * params.limit;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      blocks: (data || []) as BlockWithUser[],
      total: count || 0,
    };
  },

  /**
   * Check if a user is blocked
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('is_user_blocked', {
      blocker_user_id: user.id,
      blocked_user_id: userId,
    });

    if (error) return false;

    return data || false;
  },

  /**
   * Check if current user is blocked by another user
   */
  async isBlockedBy(userId: string): Promise<boolean> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('is_user_blocked', {
      blocker_user_id: userId,
      blocked_user_id: user.id,
    });

    if (error) return false;

    return data || false;
  },

  /**
   * Get blocked user IDs (for filtering)
   */
  async getBlockedUserIds(): Promise<string[]> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);

    if (error) throw error;

    return (data || []).map(block => block.blocked_id);
  },
};
