/**
 * Message service.
 * Handles community messages with real-time subscriptions and voice message support.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  CommunityMessage,
  CommunitySendMessagePayload,
  MessageFilterParams,
} from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

const supabase = createClient();

export const messageService = {
  // ============================================================================
  // Message CRUD Operations
  // ============================================================================

  /**
   * GET /messages
   * Returns paginated messages for a community.
   */
  async getMessages(
    params: MessageFilterParams
  ): Promise<{ messages: CommunityMessage[]; hasMore: boolean }> {
    let query = supabase
      .from("community_messages")
      .select(
        `
        *,
        profile:profiles!user_id(id, username, full_name, avatar_url),
        reply_message:community_messages!reply_to(
          id,
          content,
          message_type,
          profile:profiles!user_id(username, full_name)
        )
      `
      )
      .eq("community_id", params.community_id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    // Pagination: load messages before a certain timestamp
    if (params.before) {
      query = query.lt("created_at", params.before);
    }

    const limit = params.limit || 50;
    query = query.limit(limit + 1); // Fetch one extra to check if there are more

    const { data, error } = await query;

    if (error) throw error;

    const messages = data || [];
    const hasMore = messages.length > limit;

    // Return only the requested number of messages
    const returnedMessages = hasMore ? messages.slice(0, -1) : messages;

    // Reverse to show oldest first
    return {
      messages: returnedMessages.reverse() as CommunityMessage[],
      hasMore,
    };
  },

  /**
   * POST /messages
   * Sends a new message to a community.
   */
  async sendMessage(payload: CommunitySendMessagePayload): Promise<CommunityMessage> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Validate message content
    if (payload.message_type === "text" && !payload.content?.trim()) {
      throw new Error("Message content cannot be empty");
    }

    if (payload.message_type === "voice" && !payload.voice_url) {
      throw new Error("Voice URL is required for voice messages");
    }

    const { data, error } = await supabase
      .from("community_messages")
      .insert({
        community_id: payload.community_id,
        user_id: user.id,
        content: payload.content || null,
        message_type: payload.message_type,
        voice_url: payload.voice_url || null,
        voice_duration: payload.voice_duration || null,
        reply_to: payload.reply_to || null,
      })
      .select(
        `
        *,
        profile:profiles!user_id(id, username, full_name, avatar_url)
      `
      )
      .single();

    if (error) throw error;

    return data as CommunityMessage;
  },

  /**
   * PATCH /messages/:id
   * Updates a message (edit text only, within 5 minutes).
   */
  async updateMessage(
    messageId: string,
    content: string
  ): Promise<CommunityMessage> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Check if message belongs to user and is recent
    const { data: existing } = await supabase
      .from("community_messages")
      .select("user_id, created_at, message_type")
      .eq("id", messageId)
      .single();

    if (!existing) throw new Error("Message not found");

    if (existing.user_id !== user.id) {
      throw new Error("You can only edit your own messages");
    }

    if (existing.message_type !== "text") {
      throw new Error("Only text messages can be edited");
    }

    // Check if message is within edit window (5 minutes)
    const createdAt = new Date(existing.created_at).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (now - createdAt > fiveMinutes) {
      throw new Error("Messages can only be edited within 5 minutes");
    }

    const { data, error } = await supabase
      .from("community_messages")
      .update({
        content,
        is_edited: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId)
      .select(
        `
        *,
        profile:profiles!user_id(id, username, full_name, avatar_url)
      `
      )
      .single();

    if (error) throw error;

    return data as CommunityMessage;
  },

  /**
   * DELETE /messages/:id
   * Soft deletes a message (user's own or admin).
   */
  async deleteMessage(
    messageId: string,
    communityId: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Check if user owns the message
    const { data: message } = await supabase
      .from("community_messages")
      .select("user_id")
      .eq("id", messageId)
      .single();

    if (!message) throw new Error("Message not found");

    const isOwner = message.user_id === user.id;

    if (!isOwner) {
      // Check if user is admin/owner of community
      const { data: membership } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", communityId)
        .eq("user_id", user.id)
        .single();

      const isAdmin =
        membership?.role === "admin" || membership?.role === "owner";

      if (!isAdmin) {
        throw new Error(
          "You don't have permission to delete this message"
        );
      }
    }

    // Soft delete
    const { error } = await supabase
      .from("community_messages")
      .update({
        is_deleted: true,
        content: null,
        voice_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) throw error;
  },

  // ============================================================================
  // Voice Message Operations
  // ============================================================================

  /**
   * Upload voice message to storage and return URL.
   */
  async uploadVoiceMessage(
    communityId: string,
    audioBlob: Blob,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; duration: number }> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${communityId}/${user.id}/${timestamp}.webm`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("voice-messages")
      .upload(filename, audioBlob, {
        contentType: "audio/webm",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("voice-messages").getPublicUrl(data.path);

    // Calculate duration (approximate - actual duration should be passed from recorder)
    const duration = await this.getAudioDuration(audioBlob);

    if (onProgress) onProgress(100);

    return {
      url: publicUrl,
      duration: Math.round(duration),
    };
  },

  /**
   * Helper to get audio duration from blob.
   */
  async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(blob);

      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      });

      audio.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load audio"));
      });

      audio.src = url;
    });
  },

  /**
   * Delete voice message from storage.
   */
  async deleteVoiceMessage(voiceUrl: string): Promise<void> {
    // Extract path from public URL
    const urlParts = voiceUrl.split("/voice-messages/");
    if (urlParts.length !== 2) return;

    const path = urlParts[1];

    const { error } = await supabase.storage
      .from("voice-messages")
      .remove([path]);

    if (error) console.error("Failed to delete voice message:", error);
  },

  // ============================================================================
  // Real-time Subscriptions
  // ============================================================================

  /**
   * Subscribe to new messages in a community.
   */
  subscribeToMessages(
    communityId: string,
    onMessage: (message: CommunityMessage) => void,
    onDelete: (messageId: string) => void,
    onUpdate: (message: CommunityMessage) => void
  ): RealtimeChannel {
    const channel = supabase
      .channel(`community:${communityId}:messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        async (payload: { new: Record<string, unknown> }) => {
          // Fetch full message with profile data
          const { data } = await supabase
            .from("community_messages")
            .select(
              `
              *,
              profile:profiles!user_id(id, username, full_name, avatar_url),
              reply_message:community_messages!reply_to(
                id,
                content,
                message_type,
                profile:profiles!user_id(username, full_name)
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            onMessage(data as CommunityMessage);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        async (payload: { new: Record<string, unknown> }) => {
          if (payload.new.is_deleted) {
            onDelete(payload.new.id as string);
          } else {
            // Fetch updated message
            const { data } = await supabase
              .from("community_messages")
              .select(
                `
                *,
                profile:profiles!user_id(id, username, full_name, avatar_url)
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (data) {
              onUpdate(data as CommunityMessage);
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        (payload: { old: Record<string, unknown> }) => {
          onDelete(payload.old.id as string);
        }
      );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`Subscribed to messages in community ${communityId}`);
      }
    });

    return channel;
  },

  /**
   * Unsubscribe from messages.
   */
  unsubscribeFromMessages(channel: RealtimeChannel): void {
    channel.unsubscribe();
  },

  /**
   * Subscribe to typing indicators.
   */
  subscribeToTyping(
    communityId: string,
    onTyping: (userId: string, username: string, isTyping: boolean) => void
  ): RealtimeChannel {
    const channel = supabase.channel(`community:${communityId}:typing`, {
      config: {
        presence: {
          key: "typing",
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        Object.entries(state).forEach(([userId, presences]) => {
          const presence = (presences as Record<string, unknown>[])[0];
          onTyping(userId, presence.username as string, presence.isTyping as boolean);
        });
      })
      .subscribe();

    return channel;
  },

  /**
   * Broadcast typing status.
   */
  async broadcastTyping(
    channel: RealtimeChannel,
    isTyping: boolean
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      await channel.track({
        userId: user.id,
        username: profile.full_name || profile.username,
        isTyping,
        timestamp: Date.now(),
      });
    }
  },

  // ============================================================================
  // Message Reactions (Future Enhancement)
  // ============================================================================

  /**
   * Add reaction to a message.
   * Note: Requires a message_reactions table (not implemented in schema yet).
   */
  // async addReaction(messageId: string, emoji: string): Promise<void> {
  //   // TODO: Implement reactions table and logic
  //   console.log("Reactions not yet implemented");
  // },

  /**
   * Remove reaction from a message.
   */
  // async removeReaction(messageId: string, emoji: string): Promise<void> {
  //   // TODO: Implement reactions table and logic
  //   console.log("Reactions not yet implemented");
  // },

  // ============================================================================
  // Search and Filter
  // ============================================================================

  /**
   * Search messages in a community.
   */
  async searchMessages(
    communityId: string,
    query: string
  ): Promise<CommunityMessage[]> {
    const { data, error } = await supabase
      .from("community_messages")
      .select(
        `
        *,
        profile:profiles!user_id(id, username, full_name, avatar_url)
      `
      )
      .eq("community_id", communityId)
      .eq("message_type", "text")
      .eq("is_deleted", false)
      .ilike("content", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return (data as CommunityMessage[]) || [];
  },

  /**
   * Get messages by a specific user in a community.
   */
  async getMessagesByUser(
    communityId: string,
    userId: string
  ): Promise<CommunityMessage[]> {
    const { data, error } = await supabase
      .from("community_messages")
      .select(
        `
        *,
        profile:profiles!user_id(id, username, full_name, avatar_url)
      `
      )
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return (data as CommunityMessage[]) || [];
  },

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get message statistics for a community.
   */
  async getMessageStats(
    communityId: string
  ): Promise<{
    total_messages: number;
    text_messages: number;
    voice_messages: number;
    today_messages: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalResult, textResult, voiceResult, todayResult] =
      await Promise.all([
        supabase
          .from("community_messages")
          .select("*", { count: "exact", head: true })
          .eq("community_id", communityId)
          .eq("is_deleted", false),

        supabase
          .from("community_messages")
          .select("*", { count: "exact", head: true })
          .eq("community_id", communityId)
          .eq("message_type", "text")
          .eq("is_deleted", false),

        supabase
          .from("community_messages")
          .select("*", { count: "exact", head: true })
          .eq("community_id", communityId)
          .eq("message_type", "voice")
          .eq("is_deleted", false),

        supabase
          .from("community_messages")
          .select("*", { count: "exact", head: true })
          .eq("community_id", communityId)
          .gte("created_at", today.toISOString())
          .eq("is_deleted", false),
      ]);

    return {
      total_messages: totalResult.count || 0,
      text_messages: textResult.count || 0,
      voice_messages: voiceResult.count || 0,
      today_messages: todayResult.count || 0,
    };
  },
};
