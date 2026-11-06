'use client';

/**
 * ConversationsList Component
 * Displays list of user's conversations
 */

import { useState, useEffect } from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { ConversationWithDetails } from '@/types';
import { formatDistanceToNow } from '@/lib/date-utils';

interface ConversationsListProps {
  onSelectConversation: (conversation: ConversationWithDetails) => void;
  selectedConversationId?: string;
}

export default function ConversationsList({
  onSelectConversation,
  selectedConversationId,
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/messages/conversations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchConversations}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No conversations yet
        </h3>
        <p className="text-gray-600">
          Start chatting with your connections
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={`w-full flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors ${
            selectedConversationId === conversation.id
              ? 'bg-primary-50 border-l-4 border-primary-600'
              : 'border-l-4 border-transparent'
          }`}
        >
          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            {conversation.other_participant.avatar_url ? (
              <Image
                src={conversation.other_participant.avatar_url}
                alt={conversation.other_participant.username}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {conversation.other_participant.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {conversation.unread_count > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {conversation.unread_count}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-gray-900 truncate">
                {conversation.other_participant.full_name ||
                  conversation.other_participant.username}
              </p>
              {conversation.last_message_at && (
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {formatDistanceToNow(new Date(conversation.last_message_at))}
                </span>
              )}
            </div>
            {conversation.last_message_preview && (
              <p className="text-sm text-gray-600 truncate">
                {conversation.last_message_preview}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
