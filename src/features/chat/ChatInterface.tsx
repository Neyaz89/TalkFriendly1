"use client";

import { useState, useEffect, useRef } from "react";
import { chatService } from "@/services/chat.service";
import { conversationService } from "@/services/conversation.service";
import type { MessageWithSender, ConversationWithParticipant } from "@/types";
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
import { useToast } from "@/hooks/useToast";

interface ChatInterfaceProps {
  conversationId: string;
  onBack?: () => void;
}

export function ChatInterface({ conversationId, onBack }: ChatInterfaceProps) {
  const [conversation, setConversation] = useState<ConversationWithParticipant | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadConversation();
    loadMessages();
    markAsRead();

    // Subscribe to new messages
    const unsubscribe = chatService.subscribeToMessages(conversationId, (newMessage) => {
      setMessages(prev => {
        const exists = prev.find(m => m.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
      
      // Mark as read when new message arrives
      setTimeout(() => markAsRead(), 500);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      const data = await conversationService.getConversationById(conversationId);
      setConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      showToast('error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await chatService.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || sending) return;

    setSending(true);
    setMessageText("");

    try {
      await chatService.sendMessage({
        conversation_id: conversationId,
        content: text,
        type: 'text',
      });
    } catch (error: any) {
      console.error('Error sending message:', error);
      showToast('error', error.message || 'Failed to send message');
      setMessageText(text); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number) => {
    try {
      setSending(true);
      
      const { url } = await chatService.uploadVoiceMessage(audioBlob);
      
      await chatService.sendMessage({
        conversation_id: conversationId,
        content: 'Voice message',
        type: 'voice',
        voice_url: url,
        voice_duration: duration,
      });

      setShowVoiceRecorder(false);
      showToast('success', 'Voice message sent!');
    } catch (error: any) {
      console.error('Error sending voice message:', error);
      showToast('error', error.message || 'Failed to send voice message');
    } finally {
      setSending(false);
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

        <Button variant="ghost" size="sm">
          <MoreVertical className="h-5 w-5" />
        </Button>
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
            disabled={sending}
          />
        ) : (
          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceRecorder(true)}
              disabled={sending}
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
              disabled={sending}
            />

            <Button
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sending}
              size="sm"
            >
              {sending ? (
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
