/**
 * Connection and connection request related TypeScript types.
 */

import type { Database } from './database.types';

export type ConnectionRequest = Database['public']['Tables']['connection_requests']['Row'];
export type ConnectionRequestInsert = Database['public']['Tables']['connection_requests']['Insert'];
export type ConnectionRequestUpdate = Database['public']['Tables']['connection_requests']['Update'];

export type Connection = Database['public']['Tables']['connections']['Row'];
export type ConnectionInsert = Database['public']['Tables']['connections']['Insert'];
export type ConnectionUpdate = Database['public']['Tables']['connections']['Update'];

export type ConnectionStatus = 'none' | 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'connected';

export interface ConnectionRequestWithProfile extends ConnectionRequest {
  sender_profile?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    account_type: string;
  };
  receiver_profile?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    account_type: string;
  };
}

export interface ConnectionWithProfiles extends Connection {
  user_1_profile?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    account_type: string;
  };
  user_2_profile?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    account_type: string;
  };
}

export interface SendConnectionRequestPayload {
  receiver_id: string;
  message?: string;
}

export interface UpdateConnectionRequestPayload {
  status: 'accepted' | 'rejected' | 'cancelled';
}
