/**
 * Community related TypeScript types.
 */

// ============================================================================
// Core Community Types
// ============================================================================

export interface Community {
  id: string;
  name: string;
  description: string;
  category: CommunityCategory;
  owner_id: string;
  member_count: number;
  avatar_url?: string;
  cover_url?: string;
  is_private: boolean;
  settings: CommunitySettings;
  created_at: string;
  updated_at: string;
  // Joined from queries
  owner?: CommunityMemberProfile;
  is_member?: boolean;
  user_role?: MemberRole;
  unread_count?: number;
}

export interface CommunitySettings {
  allow_voice_messages: boolean;
  allow_member_posts: boolean;
  require_approval: boolean;
}

export type CommunityCategory =
  | "anxiety"
  | "stress"
  | "career"
  | "students"
  | "gaming"
  | "meditation"
  | "relationships"
  | "grief"
  | "parenting"
  | "wellness"
  | "general";

export type MemberRole = "owner" | "admin" | "member";

// ============================================================================
// Community Member Types
// ============================================================================

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  last_read_at: string;
  // Joined from profiles
  profile?: CommunityMemberProfile;
}

export interface CommunityMemberProfile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}

export interface CommunityMemberWithProfile extends CommunityMember {
  profile: CommunityMemberProfile;
}

// ============================================================================
// Message Types
// ============================================================================

export interface CommunityMessage {
  id: string;
  community_id: string;
  user_id: string;
  content?: string;
  message_type: MessageType;
  voice_url?: string;
  voice_duration?: number;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to?: string;
  created_at: string;
  updated_at: string;
  // Joined from profiles
  profile?: CommunityMemberProfile;
  // Joined from reply messages
  reply_message?: CommunityMessage;
}

export type MessageType = "text" | "voice" | "system";

export interface CommunitySendMessagePayload {
  community_id: string;
  content?: string;
  message_type: MessageType;
  voice_url?: string;
  voice_duration?: number;
  reply_to?: string;
}

// ============================================================================
// Voice Message Types
// ============================================================================

export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

export interface VoiceMessageUploadProgress {
  progress: number;
  status: "idle" | "uploading" | "processing" | "complete" | "error";
  error?: string;
}

// ============================================================================
// Community Invite Types
// ============================================================================

export interface CommunityInvite {
  id: string;
  community_id: string;
  invited_by: string;
  email: string;
  status: InviteStatus;
  expires_at: string;
  created_at: string;
}

export type InviteStatus = "pending" | "accepted" | "declined" | "expired";

// ============================================================================
// CRUD Payload Types
// ============================================================================

export interface CreateCommunityPayload {
  name: string;
  description: string;
  category: CommunityCategory;
  is_private?: boolean;
  avatar_url?: string;
  cover_url?: string;
  settings?: Partial<CommunitySettings>;
}

export interface UpdateCommunityPayload {
  name?: string;
  description?: string;
  category?: CommunityCategory;
  is_private?: boolean;
  avatar_url?: string;
  cover_url?: string;
  settings?: Partial<CommunitySettings>;
}

export interface JoinCommunityPayload {
  community_id: string;
}

export interface UpdateMemberRolePayload {
  member_id: string;
  role: MemberRole;
}

export interface SendInvitePayload {
  community_id: string;
  email: string;
}

// ============================================================================
// Filter and Query Types
// ============================================================================

export interface CommunityFilterParams {
  category?: CommunityCategory;
  search?: string;
  is_member?: boolean;
  is_private?: boolean;
  page?: number;
  limit?: number;
}

export interface MessageFilterParams {
  community_id: string;
  before?: string; // timestamp
  limit?: number;
}

export interface MemberFilterParams {
  community_id: string;
  role?: MemberRole;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Permission Types
// ============================================================================

export interface CommunityPermissions {
  can_send_messages: boolean;
  can_send_voice: boolean;
  can_edit_community: boolean;
  can_delete_community: boolean;
  can_manage_members: boolean;
  can_delete_messages: boolean;
  can_pin_messages: boolean;
  can_invite_members: boolean;
}

// ============================================================================
// Real-time Event Types
// ============================================================================

export interface MessageRealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: CommunityMessage;
  old: CommunityMessage;
}

export interface MemberRealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: CommunityMember;
  old: CommunityMember;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface CommunityUIState {
  activeView: "chat" | "members" | "settings";
  selectedMessage?: string;
  replyingTo?: CommunityMessage;
  isRecordingVoice: boolean;
  showMemberList: boolean;
  showSettings: boolean;
}
