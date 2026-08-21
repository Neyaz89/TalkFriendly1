/**
 * User profile related TypeScript types.
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "non-binary" | "prefer-not-to-say";
  interests: string[];
  goals: UserGoal[];
  streak: number;
  totalJournalEntries: number;
  totalListeningHours: number;
  achievements: Achievement[];
  joinedAt: string;
  settings: UserSettings;
}

export interface UserGoal {
  id: string;
  title: string;
  description?: string;
  progress: number; // 0-100
  targetDate?: string;
  isCompleted: boolean;
  category: "mental" | "physical" | "social" | "professional" | "creative";
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: "streak" | "journal" | "community" | "listening" | "checkin";
}

export interface UserSettings {
  darkMode: boolean;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  language: string;
}

export interface NotificationSettings {
  dailyCheckIn: boolean;
  journalReminder: boolean;
  communityUpdates: boolean;
  listenerMessages: boolean;
  eventReminders: boolean;
  weeklyInsights: boolean;
  reminderTime: string; // HH:MM format
}

export interface PrivacySettings {
  shareActivity: boolean;
  showInMatching: boolean;
  allowMessages: boolean;
  publicProfile: boolean;
}
