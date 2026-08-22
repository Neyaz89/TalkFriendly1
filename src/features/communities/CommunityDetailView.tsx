"use client";

/**
 * Community Detail View
 * Complete chat interface with real-time messages, voice recording, and admin controls.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Mic,
  Users,
  Settings,
  Search,
  MoreVertical,
  Reply,
  Trash2,
  Edit2,
  X,
  Play,
  Pause,
  Lock,
  MessageSquare,
  Plus,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { communityService } from "@/services/community.service";
import { messageService } from "@/services/message.service";
import type {
  Community,
  CommunityMessage,
  CommunityMemberWithProfile,
  CommunityPermissions,
} from "@/types";
import { ROUTES } from "@/constants";
import { formatDate, timeAgo } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CommunityDetailViewProps {
  communityId: string;
}

export function CommunityDetailView({ communityId }: CommunityDetailViewProps) {
  const { user } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [permissions, setPermissions] = useState<CommunityPermissions | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<"chat" | "members" | "settings">(
    "chat"
  );
  const [hasMore, setHasMore] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    loadCommunityData();

    return () => {
      // Cleanup real-time subscription
      if (channelRef.current) {
        messageService.unsubscribeFromMessages(channelRef.current);
      }
    };
  }, [communityId]);

  const loadCommunityData = async () => {
    try {
      setIsLoading(true);
      const [communityData, perms, messagesData] = await Promise.all([
        communityService.getCommunityById(communityId),
        communityService.getPermissions(communityId),
        messageService.getMessages({ community_id: communityId, limit: 50 }),
      ]);

      setCommunity(communityData);
      setPermissions(perms);
      setMessages(messagesData.messages);
      setHasMore(messagesData.hasMore);

      // Subscribe to real-time messages
      if (communityData.is_member) {
        subscribeToMessages();
        // Update last read timestamp
        await communityService.updateLastRead(communityId);
      }
    } catch (error) {
      console.error("Failed to load community:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = messageService.subscribeToMessages(
      communityId,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      },
      (messageId) => {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      },
      (updatedMessage) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
        );
      }
    );

    channelRef.current = channel;
  };

  const loadMoreMessages = async () => {
    if (!hasMore || messages.length === 0) return;

    try {
      const oldestMessage = messages[0];
      const data = await messageService.getMessages({
        community_id: communityId,
        before: oldestMessage.created_at,
        limit: 50,
      });

      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Failed to load more messages:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted">Loading community...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text mb-2">
            Community not found
          </h2>
          <Link href={ROUTES.COMMUNITIES}>
            <Button>Back to Communities</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!community.is_member) {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="text-center max-w-md">
          <Lock className="h-16 w-16 text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">{community.name}</h2>
          <p className="text-muted mb-6">{community.description}</p>
          <Button
            onClick={async () => {
              try {
                await communityService.joinCommunity({
                  community_id: communityId,
                });
                await loadCommunityData();
              } catch (error: any) {
                alert(error.message || "Failed to join community");
              }
            }}
          >
            Join Community
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)] bg-background">
      {/* Header */}
      <CommunityHeader
        community={community}
        activeView={activeView}
        onViewChange={setActiveView}
        userRole={community.user_role}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === "chat" && permissions && (
          <ChatView
            communityId={communityId}
            messages={messages}
            permissions={permissions}
            hasMore={hasMore}
            onLoadMore={loadMoreMessages}
            onMessageDelete={async (messageId) => {
              await messageService.deleteMessage(messageId, communityId);
            }}
          />
        )}
        {activeView === "members" && (
          <MembersView
            communityId={communityId}
            canManage={permissions?.can_manage_members || false}
          />
        )}
        {activeView === "settings" && permissions?.can_edit_community && (
          <SettingsView
            community={community}
            onUpdate={(updated) => setCommunity(updated)}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Community Header Component
// ============================================================================

interface CommunityHeaderProps {
  community: Community;
  activeView: "chat" | "members" | "settings";
  onViewChange: (view: "chat" | "members" | "settings") => void;
  userRole?: string;
}

function CommunityHeader({
  community,
  activeView,
  onViewChange,
  userRole,
}: CommunityHeaderProps) {
  return (
    <div className="border-b border-border bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link
            href={ROUTES.COMMUNITIES}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-text truncate">{community.name}</h1>
            <p className="text-xs text-muted">
              {community.member_count} members
              {userRole && (
                <span className="ml-2 text-primary">• {userRole}</span>
              )}
            </p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewChange("chat")}
            className={`p-2 rounded-xl transition-colors ${
              activeView === "chat"
                ? "bg-primary-50 text-primary"
                : "text-muted hover:bg-gray-100"
            }`}
            aria-label="Chat"
            title="Chat"
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          <button
            onClick={() => onViewChange("members")}
            className={`p-2 rounded-xl transition-colors ${
              activeView === "members"
                ? "bg-primary-50 text-primary"
                : "text-muted hover:bg-gray-100"
            }`}
            aria-label="Members"
            title="Members"
          >
            <Users className="h-5 w-5" />
          </button>
          {(userRole === "owner" || userRole === "admin") && (
            <button
              onClick={() => onViewChange("settings")}
              className={`p-2 rounded-xl transition-colors ${
                activeView === "settings"
                  ? "bg-primary-50 text-primary"
                  : "text-muted hover:bg-gray-100"
              }`}
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Chat View Component
// ============================================================================

interface ChatViewProps {
  communityId: string;
  messages: CommunityMessage[];
  permissions: CommunityPermissions;
  hasMore: boolean;
  onLoadMore: () => void;
  onMessageDelete: (messageId: string) => void;
}

function ChatView({
  communityId,
  messages,
  permissions,
  hasMore,
  onLoadMore,
  onMessageDelete,
}: ChatViewProps) {
  const { user } = useAuth();
  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    try {
      setIsSending(true);
      await messageService.sendMessage({
        community_id: communityId,
        content: inputText,
        message_type: "text",
        reply_to: replyingTo?.id,
      });

      setInputText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {hasMore && (
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onLoadMore}>
              Load more messages
            </Button>
          </div>
        )}

        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const showAvatar =
            !prevMessage || prevMessage.user_id !== message.user_id;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              showAvatar={showAvatar}
              isOwn={message.user_id === user?.id}
              canDelete={
                message.user_id === user?.id ||
                permissions.can_delete_messages
              }
              onReply={() => setReplyingTo(message)}
              onDelete={() => onMessageDelete(message.id)}
            />
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {permissions.can_send_messages && (
        <div className="border-t border-border bg-white px-4 py-3">
          {replyingTo && (
            <div className="mb-2 px-3 py-2 bg-gray-50 rounded-xl flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted">
                  Replying to {replyingTo.profile?.full_name}
                </p>
                <p className="text-sm text-text truncate">
                  {replyingTo.content}
                </p>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-gray-200 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 rounded-xl border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all max-h-32"
              rows={1}
              style={{
                minHeight: "48px",
                height: "auto",
              }}
            />

            {permissions.can_send_voice && (
              <button
                onClick={() => setShowVoiceRecorder(true)}
                className="p-3 rounded-xl border border-border hover:bg-gray-50 transition-colors"
                aria-label="Record voice message"
              >
                <Mic className="h-5 w-5" />
              </button>
            )}

            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isSending}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && permissions.can_send_voice && (
        <VoiceRecorderModal
          communityId={communityId}
          onClose={() => setShowVoiceRecorder(false)}
          onSend={async (voiceUrl, duration) => {
            await messageService.sendMessage({
              community_id: communityId,
              message_type: "voice",
              voice_url: voiceUrl,
              voice_duration: duration,
            });
            setShowVoiceRecorder(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Message Bubble Component
// ============================================================================

interface MessageBubbleProps {
  message: CommunityMessage;
  showAvatar: boolean;
  isOwn: boolean;
  canDelete: boolean;
  onReply: () => void;
  onDelete: () => void;
}

function MessageBubble({
  message,
  showAvatar,
  isOwn,
  canDelete,
  onReply,
  onDelete,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayVoice = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(message.voice_url!);
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {showAvatar ? (
        <Avatar
          src={message.profile?.avatar_url}
          name={message.profile?.full_name || message.profile?.username || "U"}
          size="sm"
          className="shrink-0"
        />
      ) : (
        <div className="w-10 shrink-0" />
      )}

      <div className={`flex-1 max-w-[70%] ${isOwn ? "items-end" : ""}`}>
        {showAvatar && !isOwn && (
          <p className="text-xs font-medium text-text mb-1 px-1">
            {message.profile?.full_name || message.profile?.username}
          </p>
        )}

        <div className="relative group">
          <div
            className={`px-4 py-3 rounded-2xl ${
              isOwn
                ? "bg-primary text-white rounded-tr-sm"
                : "bg-gray-100 text-text rounded-tl-sm"
            }`}
          >
            {message.reply_to && message.reply_message && (
              <div className="mb-2 pb-2 border-b border-white/20">
                <p className="text-xs opacity-70">
                  Reply to {message.reply_message.profile?.full_name}
                </p>
                <p className="text-xs opacity-90 line-clamp-1">
                  {message.reply_message.content}
                </p>
              </div>
            )}

            {message.message_type === "text" && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}

            {message.message_type === "voice" && (
              <button
                onClick={handlePlayVoice}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <div className="flex-1 h-8 bg-white/20 rounded-lg flex items-center px-2">
                  <div className="h-1 bg-white/40 rounded-full flex-1" />
                </div>
                <span className="text-xs">
                  {Math.floor((message.voice_duration || 0) / 60)}:
                  {String((message.voice_duration || 0) % 60).padStart(2, "0")}
                </span>
              </button>
            )}

            {message.is_edited && (
              <p className="text-xs opacity-70 mt-1">(edited)</p>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 px-1">
            <p className="text-xs text-muted">
              {formatDate(message.created_at, "h:mm a")}
            </p>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              {!isOwn && (
                <button
                  onClick={onReply}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Reply"
                >
                  <Reply className="h-3 w-3" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Members View Component (Placeholder - Will be completed in next task)
// ============================================================================

interface MembersViewProps {
  communityId: string;
  canManage: boolean;
}

function MembersView({ communityId, canManage }: MembersViewProps) {
  const [members, setMembers] = useState<CommunityMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, [communityId]);

  const loadMembers = async () => {
    try {
      const data = await communityService.getCommunityMembers({
        community_id: communityId,
      });
      setMembers(data.members);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-lg font-bold text-text mb-4">
        Members ({members.length})
      </h2>
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <Avatar
              src={member.profile.avatar_url}
              name={member.profile.full_name || member.profile.username}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium text-text">
                {member.profile.full_name || member.profile.username}
              </p>
              <p className="text-xs text-muted capitalize">{member.role}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Settings View Component
// ============================================================================

interface SettingsViewProps {
  community: Community;
  onUpdate: (community: Community) => void;
}

function SettingsView({ community, onUpdate }: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<"general" | "members" | "danger">(
    "general"
  );

  return (
    <div className="h-full overflow-hidden flex flex-col">
      {/* Tabs */}
      <div className="border-b border-border px-4">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "general"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "members"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab("danger")}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "danger"
                ? "border-red-500 text-red-600"
                : "border-transparent text-muted hover:text-text"
            }`}
          >
            Danger Zone
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "general" && (
          <GeneralSettings community={community} onUpdate={onUpdate} />
        )}
        {activeTab === "members" && (
          <MemberManagement community={community} />
        )}
        {activeTab === "danger" && (
          <DangerZone community={community} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// General Settings Tab
// ============================================================================

function GeneralSettings({
  community,
  onUpdate,
}: {
  community: Community;
  onUpdate: (community: Community) => void;
}) {
  const [formData, setFormData] = useState({
    name: community.name,
    description: community.description,
    category: community.category,
    is_private: community.is_private,
    settings: community.settings,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await communityService.updateCommunity(
        community.id,
        formData
      );
      onUpdate({ ...community, ...updated });
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error: any) {
      setSaveMessage(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    formData.name !== community.name ||
    formData.description !== community.description ||
    formData.category !== community.category ||
    formData.is_private !== community.is_private ||
    JSON.stringify(formData.settings) !== JSON.stringify(community.settings);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-bold text-text mb-4">General Settings</h3>
        {saveMessage && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm ${
              saveMessage.includes("success")
                ? "bg-green-50 text-green-600 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {saveMessage}
          </div>
        )}
      </div>

      {/* Community Name */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Community Name
        </label>
        <Input
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          maxLength={50}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
          className="w-full px-4 py-3 rounded-xl border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
          rows={4}
          maxLength={500}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Category
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              category: e.target.value as any,
            }))
          }
          className="w-full px-4 py-3 rounded-xl border border-border text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        >
          <option value="general">General</option>
          <option value="anxiety">Anxiety</option>
          <option value="stress">Stress & Burnout</option>
          <option value="career">Career</option>
          <option value="students">Students</option>
          <option value="meditation">Meditation</option>
          <option value="relationships">Relationships</option>
          <option value="grief">Grief & Loss</option>
          <option value="parenting">Parenting</option>
          <option value="gaming">Gaming</option>
          <option value="wellness">Wellness</option>
        </select>
      </div>

      {/* Privacy */}
      <div>
        <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={formData.is_private}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, is_private: e.target.checked }))
            }
            className="mt-0.5"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-muted" />
              <span className="text-sm font-medium text-text">
                Private Community
              </span>
            </div>
            <p className="text-xs text-muted">
              Only invited members can join and see content
            </p>
          </div>
        </label>
      </div>

      {/* Community Settings */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">
          Community Permissions
        </h4>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.settings.allow_member_posts}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    allow_member_posts: e.target.checked,
                  },
                }))
              }
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted" />
                <span className="text-sm font-medium text-text">
                  Allow member messages
                </span>
              </div>
              <p className="text-xs text-muted">
                All members can send messages in chat
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.settings.allow_voice_messages}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    allow_voice_messages: e.target.checked,
                  },
                }))
              }
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Mic className="h-3.5 w-3.5 text-muted" />
                <span className="text-sm font-medium text-text">
                  Allow voice messages
                </span>
              </div>
              <p className="text-xs text-muted">
                Members can send voice messages
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={formData.settings.require_approval}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    require_approval: e.target.checked,
                  },
                }))
              }
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <Shield className="h-3.5 w-3.5 text-muted" />
                <span className="text-sm font-medium text-text">
                  Require approval
                </span>
              </div>
              <p className="text-xs text-muted">
                New members need approval to join
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => {
            setFormData({
              name: community.name,
              description: community.description,
              category: community.category,
              is_private: community.is_private,
              settings: community.settings,
            });
          }}
          disabled={!hasChanges}
        >
          Reset
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Member Management Tab
// ============================================================================

function MemberManagement({ community }: { community: Community }) {
  const [members, setMembers] = useState<CommunityMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [community.id]);

  const loadMembers = async () => {
    try {
      const data = await communityService.getCommunityMembers({
        community_id: community.id,
      });
      setMembers(data.members);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await communityService.updateMemberRole(community.id, {
        member_id: memberId,
        role: newRole as any,
      });
      await loadMembers();
    } catch (error: any) {
      alert(error.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      await communityService.removeMember(community.id, memberId);
      await loadMembers();
    } catch (error: any) {
      alert(error.message || "Failed to remove member");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.profile.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-text">
          Members ({members.length})
        </h3>
        <Button size="sm" onClick={() => setShowInviteModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite
        </Button>
      </div>

      {/* Search */}
      <Input
        placeholder="Search members..."
        leftIcon={<Search className="h-4 w-4" />}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Members List */}
      <div className="space-y-2">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar
                src={member.profile.avatar_url}
                name={member.profile.full_name || member.profile.username}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">
                  {member.profile.full_name || member.profile.username}
                </p>
                <p className="text-xs text-muted">
                  Joined {formatDate(member.joined_at, "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Role Selector */}
              {member.role !== "owner" && (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                  className="px-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              )}
              {member.role === "owner" && (
                <span className="px-3 py-1.5 text-sm font-medium text-primary bg-primary-50 rounded-lg">
                  Owner
                </span>
              )}

              {/* Remove Button */}
              {member.role !== "owner" && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Remove member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          communityId={community.id}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Invite Member Modal
// ============================================================================

function InviteMemberModal({
  communityId,
  onClose,
}: {
  communityId: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleSendInvite = async () => {
    if (!email.trim()) return;

    try {
      setIsSending(true);
      await communityService.sendInvite({
        community_id: communityId,
        email: email.trim(),
      });
      setMessage("Invitation sent successfully!");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      setMessage(error.message || "Failed to send invitation");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text">Invite Member</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-xl text-sm ${
              message.includes("success")
                ? "bg-green-50 text-green-600"
                : "bg-red-50 text-red-600"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-text mb-2">
            Email Address
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
          />
          <p className="text-xs text-muted mt-2">
            We'll send them an invitation to join this community.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvite}
            disabled={!email.trim() || isSending}
          >
            {isSending ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// Danger Zone Tab
// ============================================================================

function DangerZone({ community }: { community: Community }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleteInput !== community.name) {
      alert("Community name doesn't match");
      return;
    }

    try {
      setIsDeleting(true);
      await communityService.deleteCommunity(community.id);
      window.location.href = ROUTES.COMMUNITIES;
    } catch (error: any) {
      alert(error.message || "Failed to delete community");
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-muted">
          Irreversible and destructive actions.
        </p>
      </div>

      {/* Delete Community */}
      <div className="border-2 border-red-200 rounded-xl p-6 bg-red-50/50">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-red-600 mb-1">
              Delete Community
            </h4>
            <p className="text-sm text-red-600/80">
              Once deleted, this community and all its messages will be gone
              forever. This action cannot be undone.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-100"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Community
          </Button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">
                Type <span className="font-bold">{community.name}</span> to
                confirm
              </label>
              <Input
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder={community.name}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteInput("");
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={deleteInput !== community.name || isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Forever"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Voice Recorder Modal
// ============================================================================

interface VoiceRecorderModalProps {
  communityId: string;
  onClose: () => void;
  onSend: (voiceUrl: string, duration: number) => void;
}

function VoiceRecorderModal({
  communityId,
  onClose,
  onSend,
}: VoiceRecorderModalProps) {
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "stopped">("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if (mediaRecorderRef.current && recordingState === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Use webm format for better compatibility
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecordingState("recording");

      // Start timer
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to access microphone. Please grant permission and try again.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
      
      const startTime = Date.now() - duration * 1000;
      timerIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecordingState("stopped");
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    onClose();
  };

  const playAudio = () => {
    if (!audioUrl) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
      });
    }

    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const { url, duration: actualDuration } = await messageService.uploadVoiceMessage(
        communityId,
        audioBlob,
        (progress) => setUploadProgress(progress)
      );

      await onSend(url, actualDuration);
      onClose();
    } catch (error) {
      console.error("Failed to upload voice message:", error);
      alert("Failed to upload voice message. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const maxDuration = 120; // 2 minutes max
  const isMaxDuration = duration >= maxDuration;

  useEffect(() => {
    if (isMaxDuration && recordingState === "recording") {
      stopRecording();
    }
  }, [isMaxDuration, recordingState]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-text">Record Voice Message</h3>
          <button
            onClick={cancelRecording}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            disabled={isUploading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Recording UI */}
        <div className="space-y-6">
          {/* Waveform/Status */}
          <div className="flex flex-col items-center justify-center py-8">
            {recordingState === "idle" && (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <Mic className="h-10 w-10 text-primary" />
                </div>
                <p className="text-sm text-muted">
                  Click the button below to start recording
                </p>
                <p className="text-xs text-muted mt-1">
                  Maximum duration: {formatTime(maxDuration)}
                </p>
              </div>
            )}

            {(recordingState === "recording" || recordingState === "paused") && (
              <div className="text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    recordingState === "recording"
                      ? "bg-red-500 animate-pulse"
                      : "bg-orange-500"
                  }`}
                >
                  <Mic className="h-10 w-10 text-white" />
                </div>
                <div className="text-3xl font-bold text-text mb-2">
                  {formatTime(duration)}
                </div>
                <p className="text-sm text-muted">
                  {recordingState === "recording" ? "Recording..." : "Paused"}
                </p>
                {duration > maxDuration - 10 && (
                  <p className="text-xs text-red-600 mt-2">
                    {maxDuration - duration}s remaining
                  </p>
                )}
              </div>
            )}

            {recordingState === "stopped" && audioUrl && (
              <div className="w-full">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <button
                    onClick={playAudio}
                    className="w-12 h-12 rounded-full bg-primary hover:bg-primary-600 flex items-center justify-center transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-0" />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-muted">
                        {formatTime(duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-center text-sm text-muted">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {recordingState === "idle" && (
              <Button onClick={startRecording} size="lg" className="px-8">
                <Mic className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            )}

            {recordingState === "recording" && (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={pauseRecording}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={stopRecording}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Stop
                </Button>
              </>
            )}

            {recordingState === "paused" && (
              <>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={resumeRecording}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={stopRecording}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  Stop
                </Button>
              </>
            )}

            {recordingState === "stopped" && !isUploading && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRecordingState("idle");
                    setDuration(0);
                    setAudioBlob(null);
                    if (audioUrl) {
                      URL.revokeObjectURL(audioUrl);
                    }
                    setAudioUrl(null);
                    if (audioPlayerRef.current) {
                      audioPlayerRef.current.pause();
                      audioPlayerRef.current = null;
                    }
                  }}
                >
                  Re-record
                </Button>
                <Button onClick={handleSend} className="px-8">
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </>
            )}
          </div>

          {/* Tips */}
          {recordingState === "idle" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-600">
                <strong>Tip:</strong> Speak clearly and find a quiet place for
                the best recording quality.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
