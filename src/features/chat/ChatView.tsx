"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { conversationService } from "@/services/conversation.service";
import type { ConversationWithParticipant } from "@/types";
import { ConversationList } from "./ConversationList";
import { ChatInterface } from "./ChatInterface";
import { PageLoader } from "@/components/common/LoadingSpinner";
import { MessageCircle } from "lucide-react";

export function ChatView() {
  const searchParams = useSearchParams();
  const doctorParam = searchParams?.get('doctor');
  
  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
    
    // Subscribe to conversation updates
    const unsubscribe = conversationService.subscribeToConversations((newConversation) => {
      setConversations(prev => {
        const exists = prev.find(c => c.id === newConversation.id);
        if (exists) {
          return prev.map(c => c.id === newConversation.id ? newConversation : c);
        }
        return [newConversation, ...prev];
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Auto-create conversation with doctor if specified in URL
    if (doctorParam && !loading && conversations.length > 0) {
      const existingConversation = conversations.find(
        c => c.participant?.id === doctorParam
      );
      
      if (existingConversation) {
        setSelectedConversationId(existingConversation.id);
      } else {
        createDoctorConversation(doctorParam);
      }
    }
  }, [doctorParam, loading, conversations]);

  const loadConversations = async () => {
    try {
      const data = await conversationService.getConversations();
      setConversations(data || []);
      
      // Auto-select first conversation if available
      if (data && data.length > 0 && !selectedConversationId) {
        setSelectedConversationId(data[0].id);
      }
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('Error loading conversations:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        statusText: error?.statusText,
      });
      
      // Set empty array on error so UI shows "no conversations" instead of loading forever
      setConversations([]);
      
      // If it's a database error (table doesn't exist), show helpful message
      if (error?.message?.includes('relation') || 
          error?.code === '42P01' || 
          error?.message?.includes('does not exist') ||
          error?.message?.includes('conversations')) {
        console.warn('⚠️ Database migration needed! Please run: migrations/004_social_chat_system.sql');
      }
    } finally {
      setLoading(false);
    }
  };

  const createDoctorConversation = async (doctorId: string) => {
    try {
      const conversation = await conversationService.getOrCreateConversation({
        participant_id: doctorId,
      });
      setSelectedConversationId(conversation.id);
      await loadConversations();
    } catch (error) {
      console.error('Error creating doctor conversation:', error);
    }
  };

  if (loading) {
    return <PageLoader message="Loading conversations..." />;
  }

  // Show migration reminder if no conversations table
  if (!loading && conversations.length === 0 && !selectedConversationId) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Conversations Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start chatting by connecting with other users or sending a message to a doctor.
          </p>
          
          {/* Migration reminder */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-2">
              📋 New Feature Setup Required
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              If you just deployed the social features, make sure to run the database migration:
            </p>
            <code className="block mt-2 p-2 bg-blue-100 dark:bg-blue-900/40 rounded text-xs text-left">
              migrations/004_social_chat_system.sql
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="h-full max-w-7xl mx-auto">
        <div className="h-full grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr] gap-0 md:gap-1">
          {/* Conversation List */}
          <div className="hidden md:block h-full overflow-hidden">
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={setSelectedConversationId}
              onConversationUpdated={loadConversations}
            />
          </div>

          {/* Chat Interface */}
          <div className="h-full overflow-hidden">
            {selectedConversationId ? (
              <ChatInterface
                conversationId={selectedConversationId}
                onBack={() => setSelectedConversationId(null)}
              />
            ) : (
              <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <div className="text-center p-8">
                  <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a Conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
