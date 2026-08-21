/**
 * Mood tracking related TypeScript types.
 */

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type MoodLabel = "Really Low" | "Low" | "Okay" | "Good" | "Great";

export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodLevel;
  moodLabel: MoodLabel;
  energy: number; // 1-10
  stress: number; // 1-10
  sleep: number; // 1-10 (hours, scaled)
  anxiety: number; // 1-10
  socialEnergy: number; // 1-10
  notes?: string;
  tags?: string[];
  createdAt: string;
  aiInsight?: string;
}

export interface MoodCheckInPayload {
  mood: MoodLevel;
  energy: number;
  stress: number;
  sleep: number;
  anxiety: number;
  socialEnergy: number;
  notes?: string;
  tags?: string[];
}

export interface MoodHistory {
  entries: MoodEntry[];
  averageMood: number;
  averageEnergy: number;
  averageStress: number;
  moodTrend: "improving" | "stable" | "declining";
  weeklyData: MoodWeekData[];
}

export interface MoodWeekData {
  date: string;
  mood: number;
  energy: number;
  stress: number;
  sleep: number;
  anxiety: number;
}

export interface MoodInsight {
  id: string;
  userId: string;
  moodEntryId: string;
  insight: string;
  suggestions: string[];
  generatedAt: string;
}

/** Maps mood level to display color class */
export const MOOD_COLORS: Record<MoodLevel, string> = {
  1: "text-mood-critical bg-red-50 border-red-200",
  2: "text-mood-low bg-orange-50 border-orange-200",
  3: "text-mood-okay bg-amber-50 border-amber-200",
  4: "text-mood-good bg-green-50 border-green-200",
  5: "text-mood-excellent bg-blue-50 border-blue-200",
};

export const MOOD_BG_COLORS: Record<MoodLevel, string> = {
  1: "#EF4444",
  2: "#F97316",
  3: "#F59E0B",
  4: "#22C55E",
  5: "#3B82F6",
};

export const MOOD_LABELS: Record<MoodLevel, MoodLabel> = {
  1: "Really Low",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Great",
};
