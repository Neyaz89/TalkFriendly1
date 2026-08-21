/**
 * Listener (mental health support providers) related TypeScript types.
 */

export interface Listener {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  title: string; // e.g. "Certified Mental Health Coach"
  expertise: string[];
  languages: string[];
  rating: number; // 0-5
  reviewCount: number;
  sessionCount: number;
  responseTime: string; // e.g. "Usually within 1 hour"
  pricing: ListenerPricing;
  availability: ListenerAvailability;
  isVerified: boolean;
  isOnline: boolean;
  badges: string[];
  location?: string;
  experience: number; // years
  education?: string;
  joinedAt: string;
}

export interface ListenerPricing {
  perSession: number; // in USD cents
  currency: string;
  sessionDurations: number[]; // available durations in minutes
  trialAvailable: boolean;
  trialDuration?: number;
}

export interface ListenerAvailability {
  timezone: string;
  slots: AvailabilitySlot[];
  nextAvailable?: string;
}

export interface AvailabilitySlot {
  date: string;
  times: string[];
}

export interface ListenerReview {
  id: string;
  listenerId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  sessionType: "audio" | "video";
  createdAt: string;
}

export interface ListenerFilterParams {
  expertise?: string[];
  language?: string;
  maxPrice?: number;
  rating?: number;
  availability?: "today" | "week";
  page?: number;
  limit?: number;
}
