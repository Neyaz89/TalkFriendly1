"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { feedService } from "@/services/feed.service";
import { connectionService } from "@/services/connection.service";
import type { FeedPostWithAuthor } from "@/types";
import { CreatePostCard } from "./CreatePostCard";
import { FeedPostCard } from "./FeedPostCard";
import { FeedFilters } from "./FeedFilters";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function FeedView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'public' | 'connections'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const params: any = {
        page: pageNum,
        limit: 20,
      };

      if (filter === 'public') {
        params.visibility = 'public';
      } else if (filter === 'connections') {
        params.visibility = 'connections';
      }

      const { posts: newPosts, total } = await feedService.getFeedPosts(params);

      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(posts.length + newPosts.length < total);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts(1, false);
  }, [filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts(1, false);
  };

  const handleLoadMore = () => {
    loadPosts(page + 1, true);
  };

  const handlePostCreated = (newPost: FeedPostWithAuthor) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost: FeedPostWithAuthor) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handleLikeToggle = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await feedService.unlikePost(postId);
      } else {
        await feedService.likePost(postId);
      }
      
      // Update local state
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            is_liked_by_user: !isLiked,
            likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (loading) {
    return <PageLoader message="Loading feed..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Community Feed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Connect and share with the TalkFriendly community
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Create Post */}
        <CreatePostCard onPostCreated={handlePostCreated} />

        {/* Filters */}
        <FeedFilters currentFilter={filter} onFilterChange={setFilter} />

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                No posts yet. Be the first to share something!
              </p>
            </div>
          ) : (
            <>
              {posts.map(post => (
                <FeedPostCard
                  key={post.id}
                  post={post}
                  onDelete={handlePostDeleted}
                  onUpdate={handlePostUpdated}
                  onLikeToggle={handleLikeToggle}
                />
              ))}

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                  >
                    Load More Posts
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
