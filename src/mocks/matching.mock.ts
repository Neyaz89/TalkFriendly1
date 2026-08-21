/**
 * Mock peer matching data.
 */

export interface PeerMatch {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  sharedInterests: string[];
  compatibilityScore: number; // 0-100
  mutualCommunities: string[];
  isOnline: boolean;
  joinedAt: string;
}

export const MOCK_PEER_MATCHES: PeerMatch[] = [
  {
    id: "peer_001",
    name: "Jordan K.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=JordanK",
    bio: "Working through anxiety one day at a time. Love hiking, music, and honest conversations.",
    sharedInterests: ["anxiety", "meditation", "career"],
    compatibilityScore: 94,
    mutualCommunities: ["Calm Through Anxiety", "Daily Meditation Circle"],
    isOnline: true,
    joinedAt: "2024-01-20T00:00:00Z",
  },
  {
    id: "peer_002",
    name: "Sam L.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SamL",
    bio: "Software engineer navigating burnout. Finding balance through journaling and community.",
    sharedInterests: ["stress", "career", "meditation"],
    compatibilityScore: 88,
    mutualCommunities: ["Burnout Recovery", "Career Conversations"],
    isOnline: false,
    joinedAt: "2024-02-05T00:00:00Z",
  },
  {
    id: "peer_003",
    name: "Riley M.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=RileyM",
    bio: "Graduate student, first-generation. Learning to ask for help and embrace community.",
    sharedInterests: ["students", "anxiety", "relationships"],
    compatibilityScore: 81,
    mutualCommunities: ["Student Mental Health", "Weekly Reflection"],
    isOnline: true,
    joinedAt: "2024-01-30T00:00:00Z",
  },
  {
    id: "peer_004",
    name: "Casey T.",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=CaseyT",
    bio: "Parent of two, working on not losing myself in the process. Grateful for this community.",
    sharedInterests: ["parenting", "stress", "meditation"],
    compatibilityScore: 76,
    mutualCommunities: ["Mindful Parents", "Daily Meditation Circle"],
    isOnline: false,
    joinedAt: "2024-03-01T00:00:00Z",
  },
];
