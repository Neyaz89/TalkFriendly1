/**
 * Journal service.
 * Handles all journaling API calls.
 */

import type {
  JournalEntry,
  JournalListResponse,
  CreateJournalPayload,
  UpdateJournalPayload,
  JournalSearchParams,
  AiJournalPrompt,
} from "@/types";
import { MOCK_JOURNAL_ENTRIES, MOCK_AI_PROMPTS } from "@/mocks/journals.mock";
import { delay, generateId } from "@/lib/utils";

// Mutable copy so create/update mutations are reflected during the session
let mockEntries = [...MOCK_JOURNAL_ENTRIES];

export const journalService = {
  /**
   * GET /journal
   * Returns paginated journal entries with optional filtering.
   */
  async getJournals(params?: JournalSearchParams): Promise<JournalListResponse> {
    await delay(500);

    let entries = [...mockEntries];

    // Filter by search query
    if (params?.query) {
      const q = params.query.toLowerCase();
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Filter by tags
    if (params?.tags?.length) {
      entries = entries.filter((e) =>
        params.tags!.some((tag) => e.tags.includes(tag))
      );
    }

    // Filter by mood
    if (params?.mood) {
      entries = entries.filter((e) => e.mood === params.mood);
    }

    const total = entries.length;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const start = (page - 1) * limit;
    const paginatedEntries = entries.slice(start, start + limit);

    return {
      entries: paginatedEntries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * GET /journal/:id
   * Returns a single journal entry.
   */
  async getJournalById(id: string): Promise<JournalEntry> {
    await delay(300);

    const entry = mockEntries.find((e) => e.id === id);
    if (!entry) throw new Error("Journal entry not found");

    return entry;
  },

  /**
   * POST /journal
   * Creates a new journal entry.
   */
  async createJournal(payload: CreateJournalPayload): Promise<JournalEntry> {
    await delay(600);

    const newEntry: JournalEntry = {
      id: `journal_${generateId()}`,
      userId: "user_001",
      title: payload.title || "Untitled",
      content: payload.content,
      excerpt: payload.content.slice(0, 120) + "…",
      tags: payload.tags || [],
      mood: payload.mood,
      wordCount: payload.content.split(/\s+/).filter(Boolean).length,
      isPrivate: payload.isPrivate ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockEntries.unshift(newEntry);
    return newEntry;
  },

  /**
   * PATCH /journal/:id
   * Updates an existing journal entry (autosave).
   */
  async updateJournal(payload: UpdateJournalPayload): Promise<JournalEntry> {
    await delay(300);

    const index = mockEntries.findIndex((e) => e.id === payload.id);
    if (index === -1) throw new Error("Journal entry not found");

    mockEntries[index] = {
      ...mockEntries[index],
      ...payload,
      wordCount: payload.content
        ? payload.content.split(/\s+/).filter(Boolean).length
        : mockEntries[index].wordCount,
      updatedAt: new Date().toISOString(),
    };

    return mockEntries[index];
  },

  /**
   * DELETE /journal/:id
   * Deletes a journal entry.
   */
  async deleteJournal(id: string): Promise<void> {
    await delay(400);
    mockEntries = mockEntries.filter((e) => e.id !== id);
  },

  /**
   * GET /journal/prompts
   * Returns AI-generated journal prompts.
   */
  async getPrompts(): Promise<AiJournalPrompt[]> {
    await delay(400);
    // Return 3 random prompts
    const shuffled = [...MOCK_AI_PROMPTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  },

  /**
   * POST /journal/:id/reflect
   * Generates an AI reflection on a journal entry.
   */
  async generateReflection(): Promise<string> {
    await delay(1500); // Slightly longer to simulate AI processing

    const reflections = [
      "Your writing reveals a deep sense of self-awareness. The way you navigate between feeling and analysis shows real emotional intelligence.",
      "There's a thread of resilience running through this entry. Even in difficulty, you're looking for meaning and growth.",
      "The honesty in these words is striking. You're not hiding from yourself — that takes real courage.",
      "I notice you're gentler with others than with yourself in this entry. What would it look like to offer yourself the same grace?",
    ];

    return reflections[Math.floor(Math.random() * reflections.length)];
  },
};
