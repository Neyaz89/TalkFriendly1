/**
 * AI companion related TypeScript types.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  suggestions?: string[];
  actions?: ChatAction[];
}

export interface ChatAction {
  type: "journal" | "affirmation" | "community" | "listener" | "checkin";
  label: string;
  data?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  summary?: string;
  moodBefore?: number;
  moodAfter?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessagePayload {
  conversationId?: string;
  message: string;
  context?: {
    mood?: number;
    recentJournal?: string;
  };
}

export interface AiInsight {
  id: string;
  type: "mood" | "journal" | "streak" | "pattern";
  title: string;
  description: string;
  actionLabel?: string;
  actionType?: string;
  generatedAt: string;
}

export interface ConversationSummary {
  conversationId: string;
  keyTopics: string[];
  emotionalThemes: string[];
  suggestedActions: string[];
  overallSentiment: "positive" | "neutral" | "negative";
  summary: string;
}
