/**
 * Community feed post related TypeScript types.
 */

import type { Database } from './database.types';

export type FeedPost = Database['public']['Tables']['feed_posts']['Row'];
export type FeedPostInsert = Database['public']['Tables']['feed_posts']['Insert'];
export type FeedPostUpdate = Database['public']['Tables']['feed_posts']['Update'];

export type PostLike = Database['public']['Tables']['post_likes']['Row'];
export type PostComment = Database['public']['Tables']['post_comments']['Row'];

export interface FeedPostWithAuthor extends FeedPost {
  author?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    account_type: string;
    is_verified: boolean;
  };
  is_liked_by_user?: boolean;
  user_like_id?: string | null;
}

export interface PostCommentWithAuthor extends PostComment {
  author?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  replies?: PostCommentWithAuthor[];
}

export interface CreatePostPayload {
  content: string;
  post_type?: 'text' | 'poll' | 'article';
  visibility?: 'public' | 'connections' | 'private';
  tags?: string[];
  media_urls?: string[];
}

export interface UpdatePostPayload {
  content?: string;
  tags?: string[];
  visibility?: 'public' | 'connections' | 'private';
}

export interface CreateCommentPayload {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface FeedFilterParams {
  visibility?: 'public' | 'connections' | 'all';
  author_id?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}
