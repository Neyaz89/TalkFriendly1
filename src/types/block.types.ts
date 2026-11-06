/**
 * User blocking related TypeScript types.
 */

import type { Database } from './database.types';

export type Block = Database['public']['Tables']['blocks']['Row'];
export type BlockInsert = Database['public']['Tables']['blocks']['Insert'];
export type BlockUpdate = Database['public']['Tables']['blocks']['Update'];

export interface BlockWithUser extends Block {
  blocked_user?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateBlockPayload {
  blocked_id: string;
  reason?: string;
}

export interface BlockListParams {
  page?: number;
  limit?: number;
}
