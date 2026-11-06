'use client';

/**
 * Messages Page
 * Real-time messaging interface
 */

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MessageCircle, Loader2 } from 'lucide-react';
import ConversationsList from '@/components/messaging/ConversationsList';
import ChatWindow from '@/components/messaging/ChatWindow';
import type { ConversationWithDetails } from '@/types';
import { createClient } from '@/lib/supabase/client';

function MessagesContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user');

  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithDetails | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // If user ID is provided in URL, start conversation with that user
    if (userId && currentUserId) {
      startConversationWithUser(userId);
    }
  }, [userId, currentUserId]);

  const fetchCurrentUser = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const startConversationWithUser = async (otherUserId: string) => {
    try {
      setIsLoadingConversation(true);
      const response = await fetch('/api/messages/start-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: otherUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start conversation');
      }

      const data = await response.json();
      setSelectedConversation(data.conversation);
      setShowMobileChat(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoadingConversation(false);
    }
  };

  const handleSelectConversation = (conversation: ConversationWithDetails) => {
    setSelectedConversation(conversation);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600">
                Chat with your connections
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex">
          {/* Conversations List (Desktop: always visible, Mobile: hidden when chat open) */}
          <div
            className={`${
              showMobileChat ? 'hidden lg:block' : 'block'
            } w-full lg:w-96 border-r border-gray-200 bg-white overflow-y-auto`}
          >
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Conversations
              </h2>
              <ConversationsList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
              />
            </div>
          </div>

          {/* Chat Window (Desktop: always visible if selected, Mobile: full screen when open) */}
          <div
            className={`${
              showMobileChat ? 'block' : 'hidden lg:block'
            } flex-1 bg-white`}
          >
            {isLoadingConversation ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : selectedConversation ? (
              <ChatWindow
                conversation={selectedConversation}
                currentUserId={currentUserId}
                onBack={handleBackToList}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
