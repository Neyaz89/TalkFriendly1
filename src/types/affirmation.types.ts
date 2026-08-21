/**
 * Affirmation related TypeScript types.
 */

export interface Affirmation {
  id: string;
  userId?: string;
  text: string;
  category: AffirmationCategory;
  isAiGenerated: boolean;
  isUserCreated: boolean;
  isFavorited: boolean;
  audioUrl?: string;
  hasVoiceRecording: boolean;
  createdAt: string;
}

export type AffirmationCategory =
  | "confidence"
  | "gratitude"
  | "healing"
  | "strength"
  | "love"
  | "success"
  | "peace"
  | "growth"
  | "general";

export interface CreateAffirmationPayload {
  text: string;
  category: AffirmationCategory;
  audioUrl?: string;
}

export interface AffirmationReminder {
  id: string;
  affirmationId: string;
  time: string; // HH:MM
  days: string[]; // ["monday", "tuesday", etc.]
  isActive: boolean;
}
