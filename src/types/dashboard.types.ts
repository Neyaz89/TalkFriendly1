/**
 * Dashboard related TypeScript types.
 */

import type { MoodEntry } from "./mood.types";
import type { JournalEntry } from "./journal.types";
import type { ListeningCircle } from "./event.types";
import type { Listener } from "./listener.types";
import type { Community } from "./community.types";

export interface DashboardData {
  user: {
    id: string;
    name: string;
    avatar?: string;
    streak: number;
  };
  todayCheckIn?: MoodEntry;
  recentMoods: MoodEntry[];
  moodStreak: number;
  todayReflection?: string;
  recentJournal?: JournalEntry;
  journalCount: number;
  upcomingCircles: ListeningCircle[];
  recommendedListener?: Listener;
  recommendedCommunities: Community[];
  quickActions: QuickAction[];
  dailyGoals: DailyGoal[];
  achievements: DashboardAchievement[];
  weeklyInsight?: string;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  color: string;
  description: string;
}

export interface DailyGoal {
  id: string;
  title: string;
  isCompleted: boolean;
  icon: string;
  xp: number;
}

export interface DashboardAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isNew: boolean;
  earnedAt: string;
}
