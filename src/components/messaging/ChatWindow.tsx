'use client';

/**
 * ChatWindow Component
 * Real-time chat interface for conversations
 */

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import type { ConversationWithDetails, MessageWithSender } from '@/types';
import { messagingService } from '@/services/messaging.service';
import { formatDistanceToNow } from '@/lib/date-utils';

interface ChatWindowProps {
  conversation: ConversationWithDetails;
  currentUserId: string;
  onBack?: () => void;
}

export default function ChatWindow({
  conversation,
  currentUserId,
  onBack,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    markAsRead();

    // Subscribe to new messages
    const unsubscribe = messagingService.subscribeToConversation(
      conversation.id,
      (message) => {
        console.log('📩 Real-time message received:', message.id, message.content?.substring(0, 20) || '(empty)');
        
        // Check if message already exists (to avoid duplicates from optimistic updates)
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === message.id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping:', message.id);
            return prev;
          }
          
          console.log('✅ Adding new message from subscription:', message.id);
          return [...prev, message];
        });
        scrollToBottom();
        
        // Mark as read if sender is not current user
        if (message.sender_id !== currentUserId) {
          markAsRead();
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [conversation.id]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/messages/list?conversation_id=${conversation.id}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages);
      scrollToBottom();
    } catch (err: any) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.id }),
      });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: conversation.other_participant.id,
          content: messageContent,
          conversation_id: conversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add message immediately with duplicate check (optimistic update)
      if (data.message) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.message.id);
          if (exists) {
            console.log('Message already exists, skipping optimistic update');
            return prev;
          }
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    } catch (err: any) {
      alert(err.message);
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const groupMessagesByDate = (messages: MessageWithSender[]) => {
    const groups: { [key: string]: MessageWithSender[] } = {};
    
    messages.forEach((message) => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {conversation.other_participant.avatar_url ? (
          <Image
            src={conversation.other_participant.avatar_url}
            alt={conversation.other_participant.username}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {conversation.other_participant.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-gray-900">
            {conversation.other_participant.full_name ||
              conversation.other_participant.username}
          </h3>
          <p className="text-sm text-gray-500">
            {conversation.other_participant.profession || '👤 User'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {date}
                </span>
              </div>

              {/* Messages */}
              {dateMessages.map((message) => {
                const isOwn = message.sender_id === currentUserId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isOwn
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      } rounded-lg px-4 py-2`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-100' : 'text-gray-500'
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.created_at))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
