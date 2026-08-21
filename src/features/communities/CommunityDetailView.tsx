"use client";

/**
 * Community detail page — shows posts, weekly question, members, and discussion feed.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Pin, Send, Lock, Globe, Users, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { communityService } from "@/services/community.service";
import type { Community, CommunityPost } from "@/types";
import { ROUTES, COMMUNITY_CATEGORY_LABELS } from "@/constants";
import { timeAgo } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";

interface CommunityDetailViewProps {
  communityId: string;
}

export function CommunityDetailView({ communityId }: CommunityDetailViewProps) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    Promise.all([
      communityService.getCommunityById(communityId),
      communityService.getCommunityPosts(communityId),
    ]).then(([comm, postList]) => {
      setCommunity(comm);
      setPosts(postList);
      setIsLoading(false);
    });
  }, [communityId]);

  const handleJoin = async () => {
    if (!community) return;
    const updated = community.isJoined
      ? await communityService.leaveCommunity(communityId)
      : await communityService.joinCommunity(communityId);
    setCommunity(updated);
  };

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setIsPosting(true);
    const post = await communityService.createPost({ communityId, content: newPost, isAnonymous });
    setPosts((prev) => [post, ...prev]);
    setNewPost("");
    setIsPosting(false);
  };

  const handleLike = async (postId: string) => {
    const updated = await communityService.toggleLike(postId);
    setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <CardSkeleton className="h-40" />
        {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  if (!community) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={ROUTES.COMMUNITIES} className="p-2 rounded-xl hover:bg-secondary text-muted hover:text-text transition-colors" aria-label="Back to communities">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-text truncate">{community.name}</h1>
      </div>

      {/* Community header card */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs capitalize">
                  {COMMUNITY_CATEGORY_LABELS[community.category] || community.category}
                </Badge>
                {community.isPrivate ? (
                  <Lock className="h-3.5 w-3.5 text-muted" aria-label="Private" />
                ) : (
                  <Globe className="h-3.5 w-3.5 text-muted" aria-label="Public" />
                )}
              </div>
              <p className="text-sm text-muted leading-relaxed">{community.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{community.memberCount.toLocaleString()} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-green-400 rounded-full" />
                  <span>{community.activeMembers} active today</span>
                </div>
              </div>
            </div>
            <Button
              variant={community.isJoined ? "outline" : "default"}
              size="sm"
              onClick={handleJoin}
              className="shrink-0"
            >
              {community.isJoined ? "Leave" : "Join"}
            </Button>
          </div>

          {/* Weekly question */}
          {community.weeklyQuestion && (
            <div className="mt-4 p-4 bg-primary-50 rounded-xl border border-primary-100">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                <p className="text-xs font-semibold text-primary">Question of the Week</p>
              </div>
              <p className="text-sm text-primary-800 italic">&ldquo;{community.weeklyQuestion}&rdquo;</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New post box */}
      {community.isJoined && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share something with the community…"
              rows={3}
              className="w-full resize-none text-sm text-text placeholder:text-muted border-none outline-none bg-transparent leading-relaxed"
              aria-label="Write a post"
            />
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                onClick={() => setIsAnonymous((v) => !v)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${isAnonymous ? "bg-gray-100 border-gray-300 text-gray-600" : "border-border text-muted hover:border-primary/50"}`}
              >
                {isAnonymous ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {isAnonymous ? "Anonymous" : "Public"}
              </button>
              <Button size="sm" onClick={handlePost} isLoading={isPosting} disabled={!newPost.trim()} className="gap-2">
                <Send className="h-3.5 w-3.5" />Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts feed */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <PostCard post={post} onLike={handleLike} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PostCard({ post, onLike }: { post: CommunityPost; onLike: (id: string) => void }) {
  return (
    <Card className={post.isPinned ? "border-primary/30 bg-primary-50/30" : ""}>
      <CardContent className="p-5">
        {post.isPinned && (
          <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-3">
            <Pin className="h-3.5 w-3.5" aria-hidden="true" />Pinned
          </div>
        )}
        <div className="flex gap-3 mb-3">
          <Avatar
            src={post.isAnonymous ? undefined : post.authorAvatar}
            name={post.authorName}
            size="sm"
          />
          <div>
            <p className="text-sm font-semibold text-text">{post.authorName}</p>
            <p className="text-xs text-muted">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        <p className="text-sm text-text leading-relaxed mb-4">{post.content}</p>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs capitalize">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 text-xs transition-colors ${post.isLiked ? "text-primary" : "text-muted hover:text-primary"}`}
            aria-label={post.isLiked ? "Unlike post" : "Like post"}
            aria-pressed={post.isLiked}
          >
            <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
            <span>{post.likes}</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{post.comments} replies</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
