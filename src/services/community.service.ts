/**
 * Community service.
 * Handles all community-related CRUD operations with Supabase.
 */

import { createClient } from "@/lib/supabase/client";
import type {
  Community,
  CommunityMember,
  CommunityMemberWithProfile,
  CreateCommunityPayload,
  UpdateCommunityPayload,
  CommunityFilterParams,
  MemberFilterParams,
  JoinCommunityPayload,
  UpdateMemberRolePayload,
  SendInvitePayload,
  CommunityPermissions,
  MemberRole,
} from "@/types";

const supabase = createClient();

export const communityService = {
  // ============================================================================
  // Community CRUD Operations
  // ============================================================================

  /**
   * GET /communities
   * Returns a list of communities with optional filtering.
   */
  async getCommunities(
    params?: CommunityFilterParams
  ): Promise<{ communities: Community[]; total: number }> {
    let query = supabase
      .from("communities")
      .select(
        `
        *,
        owner:profiles!owner_id(id, username, full_name, avatar_url),
        community_members!inner(user_id, role)
      `,
        { count: "exact" }
      );

    // Filter by category
    if (params?.category) {
      query = query.eq("category", params.category);
    }

    // Filter by search term
    if (params?.search) {
      query = query.or(
        `name.ilike.%${params.search}%,description.ilike.%${params.search}%`
      );
    }

    // Filter by privacy
    if (params?.is_private !== undefined) {
      query = query.eq("is_private", params.is_private);
    } else {
      // By default, only show public communities unless user is a member
      query = query.eq("is_private", false);
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    query = query.range(start, end).order("updated_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    // Get current user to check membership
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Enhance communities with membership info
    const communities: Community[] = (data || []).map((community: any) => {
      const userMembership = user
        ? community.community_members?.find(
            (m: any) => m.user_id === user.id
          )
        : null;

      return {
        ...community,
        is_member: !!userMembership,
        user_role: userMembership?.role as MemberRole | undefined,
      };
    });

    // Filter by membership if requested
    let filteredCommunities = communities;
    if (params?.is_member !== undefined) {
      filteredCommunities = communities.filter(
        (c) => c.is_member === params.is_member
      );
    }

    return {
      communities: filteredCommunities,
      total: count || 0,
    };
  },

  /**
   * GET /communities/:id
   * Returns a single community with full details.
   */
  async getCommunityById(id: string): Promise<Community> {
    const { data, error } = await supabase
      .from("communities")
      .select(
        `
        *,
        owner:profiles!owner_id(id, username, full_name, avatar_url, bio)
      `
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Community not found");

    // Get current user membership info
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: membership } = await supabase
        .from("community_members")
        .select("role, last_read_at")
        .eq("community_id", id)
        .eq("user_id", user.id)
        .single();

      return {
        ...data,
        is_member: !!membership,
        user_role: membership?.role as MemberRole | undefined,
      };
    }

    return {
      ...data,
      is_member: false,
    };
  },

  /**
   * POST /communities
   * Creates a new community.
   */
  async createCommunity(payload: CreateCommunityPayload): Promise<Community> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("communities")
      .insert({
        name: payload.name,
        description: payload.description,
        category: payload.category,
        owner_id: user.id,
        is_private: payload.is_private || false,
        avatar_url: payload.avatar_url,
        cover_url: payload.cover_url,
        settings: payload.settings || {
          allow_voice_messages: true,
          allow_member_posts: true,
          require_approval: false,
        },
      })
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      is_member: true,
      user_role: "owner",
    };
  },

  /**
   * PATCH /communities/:id
   * Updates a community (owner/admin only).
   */
  async updateCommunity(
    id: string,
    payload: UpdateCommunityPayload
  ): Promise<Community> {
    // Check permissions first
    const hasPermission = await this.checkPermission(id, "can_edit_community");
    if (!hasPermission) {
      throw new Error("You don't have permission to edit this community");
    }

    const { data, error } = await supabase
      .from("communities")
      .update({
        name: payload.name,
        description: payload.description,
        category: payload.category,
        is_private: payload.is_private,
        avatar_url: payload.avatar_url,
        cover_url: payload.cover_url,
        settings: payload.settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * DELETE /communities/:id
   * Deletes a community (owner only).
   */
  async deleteCommunity(id: string): Promise<void> {
    const hasPermission = await this.checkPermission(
      id,
      "can_delete_community"
    );
    if (!hasPermission) {
      throw new Error("You don't have permission to delete this community");
    }

    const { error } = await supabase.from("communities").delete().eq("id", id);

    if (error) throw error;
  },

  // ============================================================================
  // Member Management
  // ============================================================================

  /**
   * GET /communities/:id/members
   * Returns members of a community.
   */
  async getCommunityMembers(
    params: MemberFilterParams
  ): Promise<{ members: CommunityMemberWithProfile[]; total: number }> {
    let query = supabase
      .from("community_members")
      .select(
        `
        *,
        profile:profiles!user_id(id, username, full_name, avatar_url, bio)
      `,
        { count: "exact" }
      )
      .eq("community_id", params.community_id);

    // Filter by role
    if (params.role) {
      query = query.eq("role", params.role);
    }

    // Search by name
    if (params.search) {
      // Note: This requires a view or function for proper search
      query = query.ilike("profile.full_name", `%${params.search}%`);
    }

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 50;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    query = query
      .range(start, end)
      .order("role", { ascending: true })
      .order("joined_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      members: (data as CommunityMemberWithProfile[]) || [],
      total: count || 0,
    };
  },

  /**
   * POST /communities/join
   * Joins a community.
   */
  async joinCommunity(payload: JoinCommunityPayload): Promise<CommunityMember> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Check if community exists and is public or user has invite
    const { data: community } = await supabase
      .from("communities")
      .select("is_private, settings")
      .eq("id", payload.community_id)
      .single();

    if (!community) throw new Error("Community not found");

    if (community.is_private) {
      // Check for pending invite
      const { data: invite } = await supabase
        .from("community_invites")
        .select("*")
        .eq("community_id", payload.community_id)
        .eq("email", user.email!)
        .eq("status", "pending")
        .single();

      if (!invite) {
        throw new Error("This is a private community. You need an invitation.");
      }

      // Update invite status
      await supabase
        .from("community_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);
    }

    const { data, error } = await supabase
      .from("community_members")
      .insert({
        community_id: payload.community_id,
        user_id: user.id,
        role: "member",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation - already a member
        throw new Error("You are already a member of this community");
      }
      throw error;
    }

    return data;
  },

  /**
   * DELETE /communities/:id/leave
   * Leaves a community.
   */
  async leaveCommunity(communityId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    // Check if user is the owner
    const { data: community } = await supabase
      .from("communities")
      .select("owner_id")
      .eq("id", communityId)
      .single();

    if (community?.owner_id === user.id) {
      throw new Error(
        "You cannot leave a community you own. Transfer ownership or delete the community."
      );
    }

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", user.id);

    if (error) throw error;
  },

  /**
   * PATCH /communities/:id/members/:memberId/role
   * Updates a member's role (admin/owner only).
   */
  async updateMemberRole(
    communityId: string,
    payload: UpdateMemberRolePayload
  ): Promise<CommunityMember> {
    const hasPermission = await this.checkPermission(
      communityId,
      "can_manage_members"
    );
    if (!hasPermission) {
      throw new Error("You don't have permission to manage members");
    }

    // Cannot change owner role
    const { data: targetMember } = await supabase
      .from("community_members")
      .select("role")
      .eq("id", payload.member_id)
      .single();

    if (targetMember?.role === "owner") {
      throw new Error("Cannot change the role of the community owner");
    }

    const { data, error } = await supabase
      .from("community_members")
      .update({ role: payload.role })
      .eq("id", payload.member_id)
      .eq("community_id", communityId)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  /**
   * DELETE /communities/:id/members/:memberId
   * Removes a member from the community (admin/owner only).
   */
  async removeMember(communityId: string, memberId: string): Promise<void> {
    const hasPermission = await this.checkPermission(
      communityId,
      "can_manage_members"
    );
    if (!hasPermission) {
      throw new Error("You don't have permission to remove members");
    }

    // Cannot remove owner
    const { data: targetMember } = await supabase
      .from("community_members")
      .select("role")
      .eq("id", memberId)
      .single();

    if (targetMember?.role === "owner") {
      throw new Error("Cannot remove the community owner");
    }

    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("id", memberId)
      .eq("community_id", communityId);

    if (error) throw error;
  },

  // ============================================================================
  // Invitations
  // ============================================================================

  /**
   * POST /communities/:id/invite
   * Sends an invitation to join a private community.
   */
  async sendInvite(payload: SendInvitePayload): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("User not authenticated");

    const hasPermission = await this.checkPermission(
      payload.community_id,
      "can_invite_members"
    );
    if (!hasPermission) {
      throw new Error("You don't have permission to invite members");
    }

    const { error } = await supabase.from("community_invites").insert({
      community_id: payload.community_id,
      invited_by: user.id,
      email: payload.email,
      status: "pending",
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });

    if (error) throw error;

    // TODO: Send email notification
  },

  // ============================================================================
  // Permissions
  // ============================================================================

  /**
   * Get user permissions for a community.
   */
  async getPermissions(communityId: string): Promise<CommunityPermissions> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        can_send_messages: false,
        can_send_voice: false,
        can_edit_community: false,
        can_delete_community: false,
        can_manage_members: false,
        can_delete_messages: false,
        can_pin_messages: false,
        can_invite_members: false,
      };
    }

    const { data: membership } = await supabase
      .from("community_members")
      .select("role")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return {
        can_send_messages: false,
        can_send_voice: false,
        can_edit_community: false,
        can_delete_community: false,
        can_manage_members: false,
        can_delete_messages: false,
        can_pin_messages: false,
        can_invite_members: false,
      };
    }

    const isOwner = membership.role === "owner";
    const isAdmin = membership.role === "admin" || isOwner;
    const isMember = membership.role === "member" || isAdmin;

    // Get community settings
    const { data: community } = await supabase
      .from("communities")
      .select("settings")
      .eq("id", communityId)
      .single();

    const settings = community?.settings || {
      allow_voice_messages: true,
      allow_member_posts: true,
      require_approval: false,
    };

    return {
      can_send_messages: isMember && settings.allow_member_posts,
      can_send_voice: isMember && settings.allow_voice_messages,
      can_edit_community: isAdmin,
      can_delete_community: isOwner,
      can_manage_members: isAdmin,
      can_delete_messages: isAdmin,
      can_pin_messages: isAdmin,
      can_invite_members: isAdmin,
    };
  },

  /**
   * Check a specific permission.
   */
  async checkPermission(
    communityId: string,
    permission: keyof CommunityPermissions
  ): Promise<boolean> {
    const permissions = await this.getPermissions(communityId);
    return permissions[permission];
  },

  // ============================================================================
  // Utilities
  // ============================================================================

  /**
   * Update last read timestamp for a user in a community.
   */
  async updateLastRead(communityId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("community_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("community_id", communityId)
      .eq("user_id", user.id);
  },

  /**
   * Get unread message count for a community.
   */
  async getUnreadCount(communityId: string): Promise<number> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return 0;

    const { data: membership } = await supabase
      .from("community_members")
      .select("last_read_at")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .single();

    if (!membership) return 0;

    const { count } = await supabase
      .from("community_messages")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId)
      .gt("created_at", membership.last_read_at || "1970-01-01");

    return count || 0;
  },
};
