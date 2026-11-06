"use client";

import { useState, useEffect } from "react";
import type { MessageWithSender } from "@/types";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { VoiceMessagePlayer } from "./VoiceMessagePlayer";
import { Check, CheckCheck } from "lucide-react";

interface ChatMessageProps {
  message: MessageWithSender;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const { user } = useAuth();
  const [showFullTime, setShowFullTime] = useState(false);
  
  const isOwnMessage = message.sender_id === user?.id;
  const sender = message.sender;

  return (
    <div className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar (only for other user's messages) */}
      {!isOwnMessage && (
        <Avatar
          src={sender?.avatar_url || undefined}
          name={sender?.full_name || sender?.username || 'User'}
          size="sm"
          className="flex-shrink-0"
        />
      )}

      {/* Message Content */}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender Name (only for other user's messages) */}
        {!isOwnMessage && (
          <span className="text-xs text-gray-600 dark:text-gray-400 px-3">
            {sender?.full_name || sender?.username || 'Unknown'}
          </span>
        )}

        {/* Message Bubble */}
        <div
          className={`
            rounded-2xl px-4 py-2 break-words
            ${isOwnMessage
              ? 'bg-primary-500 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
            }
          `}
        >
          {message.type === 'voice' && message.voice_url ? (
            <VoiceMessagePlayer
              url={message.voice_url}
              duration={message.voice_duration || 0}
              isOwnMessage={isOwnMessage}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Time and Status */}
        <div className="flex items-center gap-1.5 px-3">
          <button
            onClick={() => setShowFullTime(!showFullTime)}
            className="text-xs text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-400 transition-colors"
          >
            {showFullTime
              ? format(new Date(message.created_at), 'MMM d, yyyy h:mm a')
              : formatDistanceToNow(new Date(message.created_at), { addSuffix: true })
            }
          </button>

          {/* Read Status (only for own messages) */}
          {isOwnMessage && (
            <span className="text-gray-500 dark:text-gray-500">
              {message.read_at ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary-500" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
