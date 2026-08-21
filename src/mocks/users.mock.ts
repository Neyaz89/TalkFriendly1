/**
 * Mock user data for development.
 * Represents realistic user profiles as if returned by the FastAPI backend.
 */

import type { UserProfile, AuthUser } from "@/types";

export const MOCK_AUTH_USER: AuthUser = {
  id: "user_001",
  name: "Alex Morgan",
  email: "alex@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  role: "user",
  isVerified: true,
  createdAt: "2024-01-15T08:00:00Z",
};

export const MOCK_USER_PROFILE: UserProfile = {
  id: "user_001",
  name: "Alex Morgan",
  email: "alex@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
  bio: "Exploring mindfulness and building healthy habits. Love hiking, reading, and connecting with people who care about growth.",
  location: "San Francisco, CA",
  timezone: "America/Los_Angeles",
  dateOfBirth: "1993-04-22",
  gender: "prefer-not-to-say",
  interests: ["meditation", "anxiety", "career", "relationships"],
  goals: [
    {
      id: "goal_001",
      title: "Meditate daily for 30 days",
      description: "Build a consistent meditation practice",
      progress: 73,
      targetDate: "2024-03-31",
      isCompleted: false,
      category: "mental",
    },
    {
      id: "goal_002",
      title: "Journal 3x per week",
      description: "Process emotions through writing",
      progress: 60,
      targetDate: "2024-04-30",
      isCompleted: false,
      category: "mental",
    },
    {
      id: "goal_003",
      title: "Connect with 2 listeners",
      description: "Explore professional support",
      progress: 100,
      targetDate: "2024-02-28",
      isCompleted: true,
      category: "social",
    },
  ],
  streak: 14,
  totalJournalEntries: 47,
  totalListeningHours: 12,
  achievements: [
    {
      id: "ach_001",
      title: "First Check-in",
      description: "Completed your first daily check-in",
      icon: "✨",
      earnedAt: "2024-01-16T09:00:00Z",
      category: "checkin",
    },
    {
      id: "ach_002",
      title: "7-Day Streak",
      description: "Checked in 7 days in a row",
      icon: "🔥",
      earnedAt: "2024-01-23T09:00:00Z",
      category: "streak",
    },
    {
      id: "ach_003",
      title: "Deep Writer",
      description: "Wrote 10 journal entries",
      icon: "📖",
      earnedAt: "2024-02-01T14:00:00Z",
      category: "journal",
    },
    {
      id: "ach_004",
      title: "Community Pioneer",
      description: "Joined your first community",
      icon: "🌱",
      earnedAt: "2024-01-20T10:00:00Z",
      category: "community",
    },
    {
      id: "ach_005",
      title: "First Connection",
      description: "Booked your first listener session",
      icon: "🤝",
      earnedAt: "2024-02-05T16:00:00Z",
      category: "listening",
    },
  ],
  joinedAt: "2024-01-15T08:00:00Z",
  settings: {
    darkMode: false,
    notifications: {
      dailyCheckIn: true,
      journalReminder: true,
      communityUpdates: true,
      listenerMessages: true,
      eventReminders: true,
      weeklyInsights: true,
      reminderTime: "09:00",
    },
    privacy: {
      shareActivity: false,
      showInMatching: true,
      allowMessages: true,
      publicProfile: false,
    },
    language: "en",
  },
};
