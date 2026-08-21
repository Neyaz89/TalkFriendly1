/**
 * Affirmation service.
 * Handles all affirmation-related API calls.
 */

import type { Affirmation, CreateAffirmationPayload, AffirmationCategory } from "@/types";
import { MOCK_AFFIRMATIONS } from "@/mocks/affirmations.mock";
import { delay, generateId } from "@/lib/utils";

let mockAffirmations = [...MOCK_AFFIRMATIONS];

export const affirmationService = {
  /**
   * GET /affirmations
   * Returns user's affirmations.
   */
  async getAffirmations(): Promise<Affirmation[]> {
    await delay(500);
    return mockAffirmations;
  },

  /**
   * GET /affirmations/today
   * Returns today's featured affirmation.
   */
  async getDailyAffirmation(): Promise<Affirmation> {
    await delay(300);
    // Return the first AI-generated affirmation as daily
    return mockAffirmations.find((a) => a.isAiGenerated) ?? mockAffirmations[0];
  },

  /**
   * POST /affirmations
   * Creates a user-written affirmation.
   */
  async createAffirmation(payload: CreateAffirmationPayload): Promise<Affirmation> {
    await delay(600);

    const newAffirmation: Affirmation = {
      id: `aff_${generateId()}`,
      userId: "user_001",
      text: payload.text,
      category: payload.category,
      isAiGenerated: false,
      isUserCreated: true,
      isFavorited: false,
      audioUrl: payload.audioUrl,
      hasVoiceRecording: !!payload.audioUrl,
      createdAt: new Date().toISOString(),
    };

    mockAffirmations.unshift(newAffirmation);
    return newAffirmation;
  },

  /**
   * POST /affirmations/generate
   * Asks AI to generate a personalized affirmation.
   */
  async generateAffirmation(category?: AffirmationCategory): Promise<Affirmation> {
    await delay(1200);

    const generated: Record<AffirmationCategory, string> = {
      confidence: "I trust my abilities and embrace challenges as opportunities to grow.",
      gratitude: "I am deeply grateful for the abundance of small joys in my daily life.",
      healing: "I am healing at my own pace, and I honor every step of the journey.",
      strength: "I carry more strength within me than I often realize.",
      love: "I am worthy of the love I so freely give to others.",
      success: "Every action I take today moves me closer to the life I'm creating.",
      peace: "I release what I cannot control and find peace in this present moment.",
      growth: "I am becoming someone I'm proud of, one day at a time.",
      general: "I choose to meet this day with openness, courage, and compassion.",
    };

    const text = category ? generated[category] : generated.general;

    return {
      id: `aff_${generateId()}`,
      text,
      category: category || "general",
      isAiGenerated: true,
      isUserCreated: false,
      isFavorited: false,
      hasVoiceRecording: false,
      createdAt: new Date().toISOString(),
    };
  },

  /**
   * POST /affirmations/:id/favorite
   * Toggles favorite status on an affirmation.
   */
  async toggleFavorite(id: string): Promise<Affirmation> {
    await delay(200);

    const index = mockAffirmations.findIndex((a) => a.id === id);
    if (index === -1) throw new Error("Affirmation not found");

    mockAffirmations[index] = {
      ...mockAffirmations[index],
      isFavorited: !mockAffirmations[index].isFavorited,
    };

    return mockAffirmations[index];
  },

  /**
   * DELETE /affirmations/:id
   * Deletes a user-created affirmation.
   */
  async deleteAffirmation(id: string): Promise<void> {
    await delay(400);
    mockAffirmations = mockAffirmations.filter((a) => a.id !== id);
  },
};
