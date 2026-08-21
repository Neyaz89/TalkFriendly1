/**
 * Community related TypeScript types.
 */

export interface Community {
  id: string;
  name: string;
  description: string;
  category: CommunityCategory;
  coverImage?: string;
  memberCount: number;
  postCount: number;
  isPrivate: boolean;
  isJoined: boolean;
  tags: string[];
  createdAt: string;
  weeklyQuestion?: string;
  activeMembers: number;
  moderators: CommunityMember[];
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
  | "weekly-reflection"
  | "general";

export interface CommunityPost {
  id: string;
  communityId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  isPinned: boolean;
  isAnonymous: boolean;
  likes: number;
  comments: number;
  isLiked: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMember {
  id: string;
  name: string;
  avatar?: string;
  role: "member" | "moderator" | "admin";
  joinedAt: string;
}

export interface CreatePostPayload {
  communityId: string;
  content: string;
  isAnonymous?: boolean;
  tags?: string[];
}

export interface CommunityFilterParams {
  category?: CommunityCategory;
  search?: string;
  joined?: boolean;
  page?: number;
  limit?: number;
}
