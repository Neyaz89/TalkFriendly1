"use client";

import type { ConversationWithParticipant } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface ConversationListProps {
  conversations: ConversationWithParticipant[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onConversationUpdated: () => void;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    const participant = conversation.participant;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      participant?.full_name?.toLowerCase().includes(searchLower) ||
      participant?.username?.toLowerCase().includes(searchLower) ||
      conversation.last_message?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
          Messages
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredConversations.map(conversation => {
              const participant = conversation.participant;
              const isSelected = conversation.id === selectedConversationId;
              const hasUnread = conversation.unread_count > 0;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`
                    w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                    ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={participant?.avatar_url || undefined}
                      name={participant?.full_name || participant?.username || 'User'}
                      size="md"
                      className="flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-medium truncate ${hasUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {participant?.full_name || participant?.username || 'Unknown User'}
                        </span>
                        
                        {conversation.last_message_at && (
                          <span className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                            {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${hasUnread ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {conversation.last_message || 'No messages yet'}
                        </p>

                        {hasUnread && (
                          <Badge variant="primary" className="flex-shrink-0 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
