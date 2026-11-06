"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { feedService } from "@/services/feed.service";
import type { FeedPostWithAuthor } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Globe, Users, Lock, Send } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface CreatePostCardProps {
  onPostCreated: (post: FeedPostWithAuthor) => void;
}

export function CreatePostCard({ onPostCreated }: CreatePostCardProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<'public' | 'connections' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      error( 'Please write something to share');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPost = await feedService.createPost({
        content: content.trim(),
        visibility,
        post_type: 'text',
      });

      // Fetch the complete post with author info
      const completePost = await feedService.getPostById(newPost.id);
      
      onPostCreated(completePost);
      setContent("");
      success( 'Post shared successfully!');
    } catch (error: any) {
      console.error('Error creating post:', error);
      error( error.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see' },
    { value: 'connections', label: 'Connections', icon: Users, description: 'Only your connections' },
    { value: 'private', label: 'Private', icon: Lock, description: 'Only you' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex gap-3">
        <Avatar
          src={user?.user_metadata?.avatar_url}
          name={user?.user_metadata?.full_name || user?.email || ''}
          size="md"
        />
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="What's on your mind? Share your thoughts with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none border-gray-200 dark:border-gray-700 focus:border-primary-500"
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between">
            {/* Visibility Selector */}
            <div className="flex items-center gap-2">
              {visibilityOptions.map(option => {
                const Icon = option.icon;
                const isSelected = visibility === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setVisibility(option.value as any)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                      transition-all duration-200
                      ${isSelected 
                        ? 'bg-primary-50 text-primary-600 border border-primary-200' 
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }
                    `}
                    disabled={isSubmitting}
                    title={option.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Post Button */}
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
