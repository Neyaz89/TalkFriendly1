/**
 * Listening circles and events related TypeScript types.
 */

export interface ListeningCircle {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  topic: string;
  category: string;
  sessionType: "audio" | "video" | "both";
  maxParticipants: number;
  currentParticipants: number;
  scheduledAt: string;
  duration: number; // minutes
  isRecurring: boolean;
  recurringSchedule?: string;
  isJoined: boolean;
  hasReminder: boolean;
  tags: string[];
  status: "upcoming" | "live" | "ended";
}

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  hostName: string;
  hostAvatar?: string;
  scheduledAt: string;
  duration: number; // minutes
  format: "online" | "in-person" | "hybrid";
  location?: string;
  maxAttendees?: number;
  currentAttendees: number;
  isJoined: boolean;
  imageUrl?: string;
  tags: string[];
  isFree: boolean;
  price?: number;
}

export type EventCategory =
  | "gratitude"
  | "work-stress"
  | "anxiety"
  | "relationships"
  | "reflection"
  | "meditation"
  | "parenting"
  | "general";
