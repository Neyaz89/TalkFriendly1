/**
 * Community service.
 * Handles all community-related API calls.
 */

import type {
  Community,
  CommunityPost,
  CommunityFilterParams,
  CreatePostPayload,
} from "@/types";
import { MOCK_COMMUNITIES, MOCK_COMMUNITY_POSTS } from "@/mocks/communities.mock";
import { delay, generateId } from "@/lib/utils";

const mockCommunities = [...MOCK_COMMUNITIES];
const mockPosts = [...MOCK_COMMUNITY_POSTS];

export const communityService = {
  /**
   * GET /communities
   * Returns a list of communities with optional filtering.
   */
  async getCommunities(params?: CommunityFilterParams): Promise<{ communities: Community[]; total: number }> {
    await delay(500);

    let communities = [...mockCommunities];

    if (params?.category) {
      communities = communities.filter((c) => c.category === params.category);
    }

    if (params?.search) {
      const q = params.search.toLowerCase();
      communities = communities.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (params?.joined) {
      communities = communities.filter((c) => c.isJoined);
    }

    return { communities, total: communities.length };
  },

  /**
   * GET /communities/:id
   * Returns a single community with full details.
   */
  async getCommunityById(id: string): Promise<Community> {
    await delay(400);

    const community = mockCommunities.find((c) => c.id === id);
    if (!community) throw new Error("Community not found");

    return community;
  },

  /**
   * POST /communities/join
   * Joins a community.
   */
  async joinCommunity(communityId: string): Promise<Community> {
    await delay(500);

    const index = mockCommunities.findIndex((c) => c.id === communityId);
    if (index === -1) throw new Error("Community not found");

    mockCommunities[index] = {
      ...mockCommunities[index],
      isJoined: true,
      memberCount: mockCommunities[index].memberCount + 1,
    };

    return mockCommunities[index];
  },

  /**
   * POST /communities/leave
   * Leaves a community.
   */
  async leaveCommunity(communityId: string): Promise<Community> {
    await delay(500);

    const index = mockCommunities.findIndex((c) => c.id === communityId);
    if (index === -1) throw new Error("Community not found");

    mockCommunities[index] = {
      ...mockCommunities[index],
      isJoined: false,
      memberCount: Math.max(0, mockCommunities[index].memberCount - 1),
    };

    return mockCommunities[index];
  },

  /**
   * GET /communities/:id/posts
   * Returns posts for a community.
   */
  async getCommunityPosts(communityId: string): Promise<CommunityPost[]> {
    await delay(400);
    return mockPosts
      .filter((p) => p.communityId === communityId)
      .sort((a, b) => {
        // Pinned posts first, then by date
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  },

  /**
   * POST /communities/posts
   * Creates a new post in a community.
   */
  async createPost(payload: CreatePostPayload): Promise<CommunityPost> {
    await delay(600);

    const newPost: CommunityPost = {
      id: `post_${generateId()}`,
      communityId: payload.communityId,
      authorId: payload.isAnonymous ? "anonymous" : "user_001",
      authorName: payload.isAnonymous ? "Anonymous" : "Alex Morgan",
      authorAvatar: payload.isAnonymous
        ? undefined
        : "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      content: payload.content,
      isPinned: false,
      isAnonymous: payload.isAnonymous ?? false,
      likes: 0,
      comments: 0,
      isLiked: false,
      tags: payload.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPosts.unshift(newPost);
    return newPost;
  },

  /**
   * POST /communities/posts/:id/like
   * Toggles like on a post.
   */
  async toggleLike(postId: string): Promise<CommunityPost> {
    await delay(200);

    const index = mockPosts.findIndex((p) => p.id === postId);
    if (index === -1) throw new Error("Post not found");

    mockPosts[index] = {
      ...mockPosts[index],
      isLiked: !mockPosts[index].isLiked,
      likes: mockPosts[index].isLiked
        ? mockPosts[index].likes - 1
        : mockPosts[index].likes + 1,
    };

    return mockPosts[index];
  },
};
