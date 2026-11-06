"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { feedService } from "@/services/feed.service";
import { connectionService } from "@/services/connection.service";
import type { FeedPostWithAuthor, ConnectionStatus } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  MoreVertical, 
  UserPlus, 
  UserCheck, 
  Clock,
  Shield,
  Edit,
  Trash2,
  Flag,
  ShieldOff
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BlockUserDialog } from "@/components/moderation/BlockUserDialog";
import { ReportDialog } from "@/components/moderation/ReportDialog";

interface FeedPostCardProps {
  post: FeedPostWithAuthor;
  onDelete: (postId: string) => void;
  onUpdate: (post: FeedPostWithAuthor) => void;
  onLikeToggle: (postId: string, isLiked: boolean) => void;
}

export function FeedPostCard({ post, onDelete, onUpdate, onLikeToggle }: FeedPostCardProps) {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('none');
  const [isLoadingConnection, setIsLoadingConnection] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { success, error } = useToast();

  const isOwnPost = post.author_id === user?.id;

  useEffect(() => {
    if (!isOwnPost && post.author?.id) {
      loadConnectionStatus();
    }
  }, [post.author?.id, isOwnPost]);

  const loadConnectionStatus = async () => {
    if (!post.author?.id) return;
    
    try {
      const status = await connectionService.getConnectionStatus(post.author.id);
      setConnectionStatus(status);
    } catch (error) {
      console.error('Error loading connection status:', error);
    }
  };

  const handleConnectionAction = async () => {
    if (!post.author?.id) return;
    
    setIsLoadingConnection(true);
    
    try {
      if (connectionStatus === 'none') {
        // Send connection request
        await connectionService.sendConnectionRequest({
          receiver_id: post.author.id,
        });
        setConnectionStatus('pending');
        success( 'Connection request sent!');
      }
    } catch (error: any) {
      console.error('Error sending connection request:', error);
      error( error.message || 'Failed to send request');
    } finally {
      setIsLoadingConnection(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await feedService.deletePost(post.id);
      onDelete(post.id);
      success( 'Post deleted');
    } catch (error: any) {
      error( error.message || 'Failed to delete post');
    }
  };

  const renderConnectionButton = () => {
    if (isOwnPost) return null;

    switch (connectionStatus) {
      case 'connected':
        return (
          <Button variant="outline" size="sm" disabled>
            <UserCheck className="h-4 w-4 mr-1.5" />
            Connected
          </Button>
        );
      
      case 'pending':
        return (
          <Button variant="outline" size="sm" disabled>
            <Clock className="h-4 w-4 mr-1.5" />
            Request Sent
          </Button>
        );
      
      case 'accepted':
        return (
          <Button variant="outline" size="sm" disabled>
            <UserCheck className="h-4 w-4 mr-1.5" />
            Connected
          </Button>
        );
      
      default:
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnectionAction}
            disabled={isLoadingConnection}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            {isLoadingConnection ? 'Sending...' : 'Connect'}
          </Button>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <Link href={`/profile/${post.author?.id}`}>
            <Avatar
              src={post.author?.avatar_url || undefined}
              name={post.author?.full_name || post.author?.username || 'User'}
              size="md"
              className="cursor-pointer hover:ring-2 hover:ring-primary-300 transition-all"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile/${post.author?.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {post.author?.full_name || post.author?.username}
              </Link>

              {post.author?.is_verified && (
                <Badge variant="primary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}

              {post.author?.account_type === 'doctor' && (
                <Badge variant="secondary" className="text-xs">
                  Doctor
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              {post.is_edited && (
                <>
                  <span>•</span>
                  <span className="text-xs">Edited</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {renderConnectionButton()}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost ? (
                <>
                  <DropdownMenuItem onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Block User
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report Post
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
          {post.content}
        </p>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Engagement Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {/* Like Button */}
          <button
            onClick={() => onLikeToggle(post.id, post.is_liked_by_user || false)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors group"
          >
            <Heart
              className={`h-5 w-5 group-hover:scale-110 transition-transform ${
                post.is_liked_by_user ? 'fill-red-500 text-red-500' : ''
              }`}
            />
            <span className="text-sm font-medium">{post.likes_count || 0}</span>
          </button>

          {/* Comment Button */}
          <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-medium">{post.comments_count || 0}</span>
          </button>
        </div>

        {/* Visibility Badge */}
        <Badge variant="outline" className="text-xs">
          {post.visibility}
        </Badge>
      </div>

      {/* Moderation Dialogs */}
      {!isOwnPost && post.author && (
        <>
          <BlockUserDialog
            open={showBlockDialog}
            onClose={() => setShowBlockDialog(false)}
            userId={post.author.id}
            userName={post.author.full_name || post.author.username || 'User'}
            onBlocked={() => onDelete(post.id)}
          />
          <ReportDialog
            open={showReportDialog}
            onClose={() => setShowReportDialog(false)}
            entityType="post"
            entityId={post.id}
            entityTitle={post.content.slice(0, 100)}
          />
        </>
      )}
    </div>
  );
}
