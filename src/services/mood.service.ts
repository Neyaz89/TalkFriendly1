/**
 * Mood tracking service.
 * Handles all mood check-in and history API calls.
 */

import type { MoodEntry, MoodCheckInPayload, MoodHistory, MoodInsight } from "@/types";
import { MOCK_MOOD_ENTRIES, MOCK_MOOD_HISTORY } from "@/mocks/moods.mock";
import { delay, generateId } from "@/lib/utils";
import { MOOD_LABELS } from "@/types/mood.types";

export const moodService = {
  /**
   * GET /moods
   * Returns user's mood history.
   */
  async getMoods(): Promise<MoodHistory> {
    await delay(500);
    return MOCK_MOOD_HISTORY;
  },

  /**
   * POST /moods
   * Submits a new mood check-in.
   */
  async checkIn(payload: MoodCheckInPayload): Promise<MoodEntry> {
    await delay(800);

    const newEntry: MoodEntry = {
      id: `mood_${generateId()}`,
      userId: "user_001",
      mood: payload.mood,
      moodLabel: MOOD_LABELS[payload.mood],
      energy: payload.energy,
      stress: payload.stress,
      sleep: payload.sleep,
      anxiety: payload.anxiety,
      socialEnergy: payload.socialEnergy,
      notes: payload.notes,
      tags: payload.tags,
      createdAt: new Date().toISOString(),
      aiInsight: generateMockInsight(payload),
    };

    // Add to the top of mock entries (simulate persistence)
    MOCK_MOOD_ENTRIES.unshift(newEntry);

    return newEntry;
  },

  /**
   * GET /moods/:id/insight
   * Returns AI-generated insight for a specific mood entry.
   */
  async getMoodInsight(moodEntryId: string): Promise<MoodInsight> {
    await delay(1200);

    return {
      id: `insight_${generateId()}`,
      userId: "user_001",
      moodEntryId,
      insight: "Your energy levels correlate strongly with your sleep quality. On days when you sleep 7+ hours, your energy scores are 40% higher on average.",
      suggestions: [
        "Try a 5-minute breathing exercise before bed tonight",
        "Consider journaling about what's on your mind",
        "A short walk could help shift your energy",
      ],
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * GET /moods/today
   * Returns today's mood entry if it exists.
   */
  async getTodaysMood(): Promise<MoodEntry | null> {
    await delay(300);

    const today = new Date().toDateString();
    const todaysEntry = MOCK_MOOD_ENTRIES.find(
      (entry) => new Date(entry.createdAt).toDateString() === today
    );

    return todaysEntry || null;
  },
};

/** Generates a contextual mock AI insight based on check-in data */
function generateMockInsight(payload: MoodCheckInPayload): string {
  const insights = [
    "Your energy and sleep scores align closely today — good sleep really does make a difference.",
    "Notice how your stress and anxiety levels often move together. Addressing one often helps the other.",
    "You're showing real self-awareness by tracking these patterns. Keep it up.",
    "Your mood data this week shows resilience. Even the harder days are part of the journey.",
    "Based on today's numbers, some gentle movement or time in nature might help shift things.",
  ];

  if (payload.mood >= 4) {
    return "You're having a good day! Notice what's contributing to this — these are your anchors.";
  }
  if (payload.stress >= 7) {
    return "High stress today. Remember: you've navigated difficult days before and come through them.";
  }

  return insights[Math.floor(Math.random() * insights.length)];
}
