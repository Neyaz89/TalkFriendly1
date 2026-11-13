"use client";

import { useState, useEffect, useRef } from "react";
import { chatService } from "@/services/chat.service";
import { conversationService } from "@/services/conversation.service";
import type { MessageWithSender, ConversationWithParticipant } from "@/types/chat.types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Mic, 
  ArrowLeft,
  MoreVertical,
  Loader2
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { VoiceRecorder } from "./VoiceRecorder";
import { ListenerChatActions } from "./ListenerChatActions";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useMessages, 
  useSendMessage, 
  useMarkMessagesRead, 
  useMessageSubscription 
} from "@/hooks/useMessages";
import { useConversation } from "@/hooks/useConversations";

interface ChatInterfaceProps {
  conversationId: string;
  onBack?: () => void;
}

export function ChatInterface({ conversationId, onBack }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { success, error: showError } = useToast();
  const { user, profile } = useAuth(); // Get profile from AuthContext

  // Use React Query hooks for data fetching with caching
  const { data: conversation } = useConversation(conversationId);
  const { data: messages = [], isLoading: loading } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkMessagesRead();

  // Debug logging
  useEffect(() => {
    console.log('ChatInterface - Profile:', profile);
    console.log('ChatInterface - Is Listener:', profile?.account_type === 'listener');
  }, [profile]);

  // Subscribe to real-time message updates
  useMessageSubscription(conversationId);

  useEffect(() => {
    // Mark messages as read when conversation opens or new messages arrive
    if (conversationId && messages.length > 0) {
      markAsReadMutation.mutate({ conversation_id: conversationId });
    }
  }, [conversationId, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || sendMessageMutation.isPending) return;

    setMessageText(""); // Clear immediately for better UX

    try {
      await sendMessageMutation.mutateAsync({
        conversation_id: conversationId,
        content: text,
        message_type: 'text',
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      showError(error.message || 'Failed to send message');
      setMessageText(text); // Restore message on error
    }
  };

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    try {
      const voicePath = await chatService.uploadVoiceMessage(conversationId, { blob: audioBlob, duration });
      const voiceUrl = await chatService.getVoiceMessageUrl(voicePath);
      
      await sendMessageMutation.mutateAsync({
        conversation_id: conversationId,
        content: 'Voice message',
        message_type: 'voice',
        voice_url: voiceUrl,
        voice_duration: duration,
      });

      setShowVoiceRecorder(false);
      success('Voice message sent!');
    } catch (error: any) {
      console.error('Error sending voice message:', error);
      showError(error.message || 'Failed to send voice message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const participant = conversation?.participant;

  return (
    <div className="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="md:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <Avatar
            src={participant?.avatar_url || undefined}
            name={participant?.full_name || participant?.username || 'User'}
            size="md"
          />

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {participant?.full_name || participant?.username || 'Unknown User'}
            </h3>
            {participant?.account_type === 'doctor' && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Medical Professional
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Listener-only actions */}
          <ListenerChatActions
            conversationId={conversationId}
            isListener={profile?.account_type === 'listener'}
          />

          <Button variant="ghost" size="sm">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No messages yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {showVoiceRecorder ? (
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecorded}
            onCancel={() => setShowVoiceRecorder(false)}
            disabled={sendMessageMutation.isPending}
          />
        ) : (
          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceRecorder(true)}
              disabled={sendMessageMutation.isPending}
              title="Record voice message"
            >
              <Mic className="h-5 w-5" />
            </Button>

            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 resize-none"
              disabled={sendMessageMutation.isPending}
            />

            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
