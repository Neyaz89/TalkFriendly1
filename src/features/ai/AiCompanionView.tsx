"use client";

/**
 * AI Companion chat interface.
 * Premium streaming chat with typing indicators, suggested replies, and history sidebar.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Mic, Sparkles, BookOpen, Heart,
  Users, Plus, LayoutList, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { aiService } from "@/services/ai.service";
import type { ChatMessage, SendMessagePayload as AiSendMessagePayload } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { formatDate } from "@/lib/utils";
import { AiInsightsPanel } from "./AiInsightsPanel";
import { ConversationHistory } from "./ConversationHistory";

type Panel = "none" | "insights" | "history";

export function AiCompanionView() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [activePanel, setActivePanel] = useState<Panel>("none");
  const [activeConvId, setActiveConvId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Initial greeting ── */
  useEffect(() => {
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
    const greeting: ChatMessage = {
      id: "greeting",
      role: "assistant",
      content: `Hello${userName ? `, ${userName.split(" ")[0]}` : ""}! I'm your TalkFriendly companion — here to listen without judgment and help you explore what's on your mind. How are you feeling today?`,
      timestamp: new Date().toISOString(),
      suggestions: [
        "I'm feeling anxious",
        "Work has been stressful",
        "I'm actually doing great",
        "I want to journal",
      ],
    };
    setMessages([greeting]);
  }, [user]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  /* ── Auto-resize textarea ── */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 128) + "px";
  }, [input]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);
      setStreamingText("");

      try {
        await aiService.sendMessage(
          { conversationId: activeConvId, message: text } as AiSendMessagePayload,
          (chunk) => setStreamingText((prev) => prev + chunk),
          (msg) => {
            setMessages((prev) => [...prev, msg]);
            setStreamingText("");
            setIsStreaming(false);
          }
        );
      } catch {
        setIsStreaming(false);
      }
    },
    [isStreaming, activeConvId]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setActiveConvId(undefined);
    setActivePanel("none");
    setTimeout(() => {
      const greeting: ChatMessage = {
        id: `greeting_${Date.now()}`,
        role: "assistant",
        content: "New conversation started. What's on your mind?",
        timestamp: new Date().toISOString(),
        suggestions: ["I'd like to check in", "I want to journal", "I need some support"],
      };
      setMessages([greeting]);
    }, 100);
  };

  const togglePanel = (panel: Panel) => {
    setActivePanel((prev) => (prev === panel ? "none" : panel));
  };

  return (
    <div className="flex h-[calc(100vh-57px)] md:h-[calc(100vh-57px)]">
      {/* ── Left panel: Conversation history (desktop) ── */}
      <AnimatePresence>
        {activePanel === "history" && (
          <motion.div
            key="history"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block border-r border-border bg-white overflow-hidden shrink-0"
          >
            <ConversationHistory
              activeId={activeConvId}
              onSelect={(id) => { setActiveConvId(id); setActivePanel("none"); }}
              onNew={startNewConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main chat column ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">TalkFriendly AI</p>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"
                  aria-hidden="true"
                />
                <p className="text-xs text-muted">Always here for you</p>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => togglePanel("history")}
              title="Conversation history"
              aria-label="Toggle conversation history"
              aria-pressed={activePanel === "history"}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => togglePanel("insights")}
              title="My insights"
              aria-label="Toggle insights"
              aria-pressed={activePanel === "insights"}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={startNewConversation}
              title="New conversation"
              aria-label="Start new conversation"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-6 space-y-5 scrollbar-thin"
          aria-live="polite"
          aria-label="Chat messages"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                userAvatar={user?.user_metadata?.avatar_url}
                userName={user?.user_metadata?.full_name || user?.email || ""}
                onSuggestionClick={sendMessage}
              />
            ))}
          </AnimatePresence>

          {/* Streaming indicator */}
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <AiAvatar />
              <div className="max-w-[75%]">
                <div className="chat-bubble-ai px-4 py-3 text-sm shadow-card min-w-[80px]">
                  {streamingText || <TypingDots />}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border bg-white px-4 py-3">
          <div className="flex gap-2 items-end max-w-3xl mx-auto">
            {/* Textarea */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share what's on your mind…"
                rows={1}
                disabled={isStreaming}
                className="w-full resize-none rounded-2xl border border-border bg-gray-50 px-4 py-3 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                style={{ minHeight: "48px", maxHeight: "128px" }}
                aria-label="Message input"
              />
            </div>

            {/* Voice */}
            <button
              className="p-2.5 rounded-2xl text-muted hover:text-primary hover:bg-primary-50 transition-colors mb-0.5"
              aria-label="Voice input (coming soon)"
              title="Voice input"
            >
              <Mic className="h-5 w-5" />
            </button>

            {/* Send */}
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              size="icon"
              className="rounded-2xl h-11 w-11 mb-0.5"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-xs text-muted mt-2 max-w-xl mx-auto">
            TalkFriendly AI provides emotional support — not medical or clinical advice.
            If you&apos;re in crisis, please contact{" "}
            <a href="tel:988" className="text-primary hover:underline font-medium">988</a>.
          </p>
        </div>
      </div>

      {/* ── Right panel: Insights ── */}
      <AnimatePresence>
        {activePanel === "insights" && (
          <motion.div
            key="insights"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block border-l border-border bg-white overflow-y-auto shrink-0"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-text">Your Insights</p>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setActivePanel("none")}
                aria-label="Close insights"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AiInsightsPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Sub-components ── */

function AiAvatar() {
  return (
    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
      <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          className="w-1.5 h-1.5 bg-muted rounded-full block"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function ChatBubble({
  message,
  userAvatar,
  userName,
  onSuggestionClick,
}: {
  message: ChatMessage;
  userAvatar?: string;
  userName: string;
  onSuggestionClick: (text: string) => void;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      {isUser ? (
        <Avatar src={userAvatar} name={userName} size="sm" className="shrink-0 mt-0.5" />
      ) : (
        <AiAvatar />
      )}

      {/* Bubble + metadata */}
      <div
        className={`flex flex-col gap-1.5 max-w-[78%] ${isUser ? "items-end" : "items-start"}`}
      >
        <div
          className={`px-4 py-3 text-sm leading-relaxed ${
            isUser ? "chat-bubble-user" : "chat-bubble-ai shadow-card"
          }`}
        >
          {message.content}
        </div>

        <p className="text-xs text-muted px-1">
          {formatDate(message.timestamp, "h:mm a")}
        </p>

        {/* Suggested replies */}
        {message.suggestions && !isUser && (
          <div className="flex flex-wrap gap-1.5 max-w-sm">
            {message.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggestionClick(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-white border border-border hover:border-primary/50 hover:bg-primary-50 text-muted hover:text-primary transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Action chips */}
        {message.actions && !isUser && (
          <div className="flex flex-wrap gap-2">
            {message.actions.map((action) => {
              const Icon =
                action.type === "journal"
                  ? BookOpen
                  : action.type === "affirmation"
                  ? Heart
                  : Users;
              return (
                <button
                  key={action.type}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                >
                  <Icon className="h-3 w-3" aria-hidden="true" />
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
