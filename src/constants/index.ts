/**
 * Application-wide constants for TalkFriendly.
 * Centralizes magic strings, numbers, and configuration.
 */

export const APP_NAME = "TalkFriendly";
export const APP_TAGLINE = "Professional Mental Wellness Support, Powered by Empathy";
export const APP_DESCRIPTION = "Your mental wellbeing companion — check in daily, journal freely, connect with listeners, and grow with your community.";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  OTP: "/auth/otp",
  DASHBOARD: "/dashboard",
  CHECKIN: "/dashboard/checkin",
  AI: "/ai",
  JOURNAL: "/journal",
  JOURNAL_NEW: "/journal/new",
  JOURNAL_ENTRY: (id: string) => `/journal/${id}`,
  MOODS: "/moods",
  COMMUNITIES: "/communities",
  COMMUNITY: (id: string) => `/communities/${id}`,
  LISTENERS: "/listeners",
  LISTENER: (id: string) => `/listeners/${id}`,
  LISTENER_BOOK: (id: string) => `/listeners/${id}/book`,
  CIRCLES: "/circles",
  EVENTS: "/events",
  AFFIRMATIONS: "/affirmations",
  MATCHING: "/matching",
  PROFILE: "/profile",
  PROFILE_EDIT: "/profile/edit",
  SETTINGS: "/settings",
} as const;

export const NAVIGATION_ITEMS = [
  { label: "Home", href: ROUTES.DASHBOARD, icon: "Home" },
  { label: "AI Companion", href: ROUTES.AI, icon: "Sparkles" },
  { label: "Journal", href: ROUTES.JOURNAL, icon: "BookOpen" },
  { label: "Moods", href: ROUTES.MOODS, icon: "Activity" },
  { label: "Communities", href: ROUTES.COMMUNITIES, icon: "Users" },
  { label: "Listeners", href: ROUTES.LISTENERS, icon: "Headphones" },
  { label: "Circles", href: ROUTES.CIRCLES, icon: "Circle" },
  { label: "Events", href: ROUTES.EVENTS, icon: "Calendar" },
  { label: "Affirmations", href: ROUTES.AFFIRMATIONS, icon: "Heart" },
] as const;

export const MOOD_EMOJIS = {
  1: "😔",
  2: "😕",
  3: "😐",
  4: "🙂",
  5: "😊",
} as const;

export const COMMUNITY_CATEGORY_LABELS = {
  anxiety: "Anxiety",
  stress: "Stress & Burnout",
  career: "Career",
  students: "Students",
  gaming: "Gaming",
  meditation: "Meditation",
  relationships: "Relationships",
  grief: "Grief & Loss",
  parenting: "Parenting",
  "weekly-reflection": "Weekly Reflection",
  general: "General",
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "talkfriendly_auth_token",
  REFRESH_TOKEN: "talkfriendly_refresh_token",
  USER: "talkfriendly_user",
  THEME: "talkfriendly_theme",
  ONBOARDING_DONE: "talkfriendly_onboarding_done",
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  JOURNAL_LIMIT: 10,
  LISTENERS_LIMIT: 12,
} as const;

export const SESSION_DURATIONS = [30, 45, 60] as const;

export const CHART_COLORS = {
  mood: "#E97C5A",
  energy: "#22C55E",
  stress: "#EF4444",
  sleep: "#3B82F6",
  anxiety: "#F59E0B",
};
