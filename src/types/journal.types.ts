/**
 * Journal related TypeScript types.
 */

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string; // Rich text / markdown content
  excerpt?: string;
  tags: string[];
  mood?: number; // 1-5
  wordCount: number;
  aiPromptUsed?: string;
  aiReflection?: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJournalPayload {
  title: string;
  content: string;
  tags?: string[];
  mood?: number;
  isPrivate?: boolean;
}

export interface UpdateJournalPayload extends Partial<CreateJournalPayload> {
  id: string;
}

export interface JournalSearchParams {
  query?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  mood?: number;
  page?: number;
  limit?: number;
}

export interface JournalListResponse {
  entries: JournalEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AiJournalPrompt {
  id: string;
  prompt: string;
  category: "reflection" | "gratitude" | "growth" | "creativity" | "emotional";
}
