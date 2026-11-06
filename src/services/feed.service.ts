/**
 * Feed service.
 * Handles community feed posts, likes, and comments.
 */

import { createClient } from '@/lib/supabase/client';
import type {
  FeedPost,
  FeedPostWithAuthor,
  PostComment,
  PostCommentWithAuthor,
  CreatePostPayload,
  UpdatePostPayload,
  CreateCommentPayload,
  FeedFilterParams,
} from '@/types';

export const feedService = {
  /**
   * Get feed posts with optional filtering
   */
  async getFeedPosts(params?: FeedFilterParams): Promise<{ posts: FeedPostWithAuthor[]; total: number }> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('feed_posts')
      .select(`
        *,
        author:profiles!author_id(
          id, username, full_name, avatar_url, account_type, is_verified
        ),
        user_like:post_likes!post_id(id)
      `, { count: 'exact' })
      .eq('is_deleted', false)
      .eq('post_likes.user_id', user.id);

    // Apply visibility filter
    if (params?.visibility === 'public') {
      query = query.eq('visibility', 'public');
    } else if (params?.visibility === 'connections') {
      query = query.eq('visibility', 'connections');
    }

    // Filter by author
    if (params?.author_id) {
      query = query.eq('author_id', params.author_id);
    }

    // Filter by tags
    if (params?.tags?.length) {
      query = query.contains('tags', params.tags);
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    // Transform data to include is_liked_by_user
    const posts = (data || []).map(post => ({
      ...post,
      is_liked_by_user: post.user_like && post.user_like.length > 0,
      user_like_id: post.user_like?.[0]?.id || null,
    })) as FeedPostWithAuthor[];

    return {
      posts,
      total: count || 0,
    };
  },

  /**
   * Get a single post by ID
   */
  async getPostById(postId: string): Promise<FeedPostWithAuthor> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        *,
        author:profiles!author_id(
          id, username, full_name, avatar_url, account_type, is_verified
        ),
        user_like:post_likes!post_id(id)
      `)
      .eq('id', postId)
      .eq('is_deleted', false)
      .eq('post_likes.user_id', user.id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Post not found');

    return {
      ...data,
      is_liked_by_user: data.user_like && data.user_like.length > 0,
      user_like_id: data.user_like?.[0]?.id || null,
    } as FeedPostWithAuthor;
  },

  /**
   * Create a new feed post
   */
  async createPost(payload: CreatePostPayload): Promise<FeedPost> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('feed_posts')
      .insert({
        author_id: user.id,
        content: payload.content,
        post_type: payload.post_type || 'text',
        visibility: payload.visibility || 'public',
        tags: payload.tags,
        media_urls: payload.media_urls,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Update a post
   */
  async updatePost(postId: string, payload: UpdatePostPayload): Promise<FeedPost> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('feed_posts')
      .update({
        ...payload,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('feed_posts')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) throw error;
  },

  /**
   * Like a post
   */
  async likePost(postId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('post_likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      });

    if (error) {
      // Ignore duplicate key error
      if (!error.message.includes('duplicate')) {
        throw error;
      }
    }
  },

  /**
   * Unlike a post
   */
  async unlikePost(postId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  /**
   * Get comments for a post
   */
  async getPostComments(postId: string): Promise<PostCommentWithAuthor[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        author:profiles!author_id(
          id, username, full_name, avatar_url
        )
      `)
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (data || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('post_comments')
          .select(`
            *,
            author:profiles!author_id(
              id, username, full_name, avatar_url
            )
          `)
          .eq('parent_comment_id', comment.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        return {
          ...comment,
          replies: replies || [],
        } as PostCommentWithAuthor;
      })
    );

    return commentsWithReplies;
  },

  /**
   * Create a comment on a post
   */
  async createComment(payload: CreateCommentPayload): Promise<PostComment> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: payload.post_id,
        author_id: user.id,
        content: payload.content,
        parent_comment_id: payload.parent_comment_id,
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for post author (if not commenting on own post)
    const { data: post } = await supabase
      .from('feed_posts')
      .select('author_id')
      .eq('id', payload.post_id)
      .single();

    if (post && post.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        notification_type: 'comment',
        title: 'New Comment',
        message: 'Someone commented on your post',
        data: { post_id: payload.post_id, comment_id: data.id },
        link: `/feed?post=${payload.post_id}`,
      });
    }

    return data;
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, content: string): Promise<PostComment> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('post_comments')
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('author_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string): Promise<void> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('post_comments')
      .update({
        is_deleted: true,
        content: '[deleted]',
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('author_id', user.id);

    if (error) throw error;
  },

  /**
   * Get user's own posts
   */
  async getMyPosts(): Promise<FeedPostWithAuthor[]> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        *,
        author:profiles!author_id(
          id, username, full_name, avatar_url, account_type, is_verified
        )
      `)
      .eq('author_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []) as FeedPostWithAuthor[];
  },
};
