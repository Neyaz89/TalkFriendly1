/**
 * Dashboard service.
 * Fetches aggregated dashboard data for the home screen.
 */

import type { DashboardData } from "@/types";
import { MOCK_MOOD_ENTRIES } from "@/mocks/moods.mock";
import { MOCK_JOURNAL_ENTRIES } from "@/mocks/journals.mock";
import { MOCK_CIRCLES } from "@/mocks/events.mock";
import { MOCK_LISTENERS } from "@/mocks/listeners.mock";
import { MOCK_COMMUNITIES } from "@/mocks/communities.mock";
import { delay } from "@/lib/utils";

export const dashboardService = {
  /**
   * GET /dashboard
   * Returns all data needed for the main dashboard.
   */
  async getDashboard(): Promise<DashboardData> {
    await delay(600);

    return {
      user: {
        id: "user_001",
        name: "Alex",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        streak: 14,
      },
      todayCheckIn: MOCK_MOOD_ENTRIES[0],
      recentMoods: MOCK_MOOD_ENTRIES.slice(0, 7),
      moodStreak: 14,
      todayReflection: "Take a moment to notice three things you are grateful for today. Even the small ones count.",
      recentJournal: MOCK_JOURNAL_ENTRIES[0],
      journalCount: 47,
      upcomingCircles: MOCK_CIRCLES.slice(0, 2),
      recommendedListener: MOCK_LISTENERS[0],
      recommendedCommunities: MOCK_COMMUNITIES.slice(0, 3),
      quickActions: [
        {
          id: "qa_001",
          label: "Daily Check-in",
          icon: "Activity",
          href: "/dashboard/checkin",
          color: "bg-orange-50 text-orange-600",
          description: "Log your mood and energy",
        },
        {
          id: "qa_002",
          label: "Journal",
          icon: "BookOpen",
          href: "/journal/new",
          color: "bg-blue-50 text-blue-600",
          description: "Write freely",
        },
        {
          id: "qa_003",
          label: "Talk to AI",
          icon: "Sparkles",
          href: "/ai",
          color: "bg-purple-50 text-purple-600",
          description: "Chat with your companion",
        },
        {
          id: "qa_004",
          label: "Find a Listener",
          icon: "Headphones",
          href: "/listeners",
          color: "bg-green-50 text-green-600",
          description: "Book a support session",
        },
      ],
      dailyGoals: [
        { id: "dg_001", title: "Complete daily check-in", isCompleted: true, icon: "✅", xp: 10 },
        { id: "dg_002", title: "Write a journal entry", isCompleted: false, icon: "📖", xp: 20 },
        { id: "dg_003", title: "Read an affirmation", isCompleted: true, icon: "💛", xp: 5 },
        { id: "dg_004", title: "Join a community discussion", isCompleted: false, icon: "🌱", xp: 15 },
      ],
      achievements: [
        {
          id: "ach_001",
          title: "7-Day Streak 🔥",
          description: "Checked in 7 days in a row",
          icon: "🔥",
          isNew: true,
          earnedAt: new Date().toISOString(),
        },
      ],
      weeklyInsight: "Your mood has been trending upward this week. You tend to feel best after social interactions and creative activities.",
    };
  },
};
