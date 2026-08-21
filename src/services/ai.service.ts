/**
 * AI Companion service.
 * Simulates streaming AI responses (FastAPI with SSE in production).
 */

import type { ChatMessage, Conversation, SendMessagePayload, AiInsight, ConversationSummary } from "@/types";
import { MOCK_AI_RESPONSES, MOCK_SUGGESTIONS, MOCK_CONVERSATIONS, MOCK_AI_INSIGHTS } from "@/mocks/ai.mock";
import { delay, generateId } from "@/lib/utils";

const mockConversations = [...MOCK_CONVERSATIONS];

export const aiService = {
  /**
   * GET /ai/conversations
   * Returns user's past conversations.
   */
  async getConversations(): Promise<Conversation[]> {
    await delay(500);
    return mockConversations;
  },

  /**
   * GET /ai/conversations/:id
   * Returns a single conversation with all messages.
   */
  async getConversationById(id: string): Promise<Conversation> {
    await delay(300);
    const conv = mockConversations.find((c) => c.id === id);
    if (!conv) throw new Error("Conversation not found");
    return conv;
  },

  /**
   * POST /ai/message
   * Sends a message and receives an AI response.
   * In production, this would use SSE for streaming.
   * Here we simulate streaming with a callback.
   */
  async sendMessage(
    payload: SendMessagePayload,
    onChunk?: (chunk: string) => void,
    onDone?: (message: ChatMessage) => void
  ): Promise<ChatMessage> {
    // First, simulate the user message being received
    await delay(300);

    // Pick a contextual response
    const responseText = getContextualResponse(payload.message);
    const messageId = `msg_${generateId()}`;

    // Simulate streaming: emit chunks with small delays
    if (onChunk) {
      const words = responseText.split(" ");
      for (const word of words) {
        await delay(60 + Math.random() * 40);
        onChunk(word + " ");
      }
    } else {
      await delay(1500);
    }

    const assistantMessage: ChatMessage = {
      id: messageId,
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
      suggestions: Math.random() > 0.4 ? getRandomSuggestions() : undefined,
    };

    onDone?.(assistantMessage);
    return assistantMessage;
  },

  /**
   * POST /ai/conversations
   * Creates a new conversation.
   */
  async createConversation(): Promise<Conversation> {
    await delay(300);

    const newConversation: Conversation = {
      id: `conv_${generateId()}`,
      userId: "user_001",
      title: "New Conversation",
      messages: [],
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockConversations.unshift(newConversation);
    return newConversation;
  },

  /**
   * GET /ai/insights
   * Returns AI-generated insights based on user data.
   */
  async getInsights(): Promise<AiInsight[]> {
    await delay(700);
    return MOCK_AI_INSIGHTS;
  },

  /**
   * POST /ai/conversations/:id/summarize
   * Generates a conversation summary.
   */
  async summarizeConversation(conversationId: string): Promise<ConversationSummary> {
    await delay(1500);

    return {
      conversationId,
      keyTopics: ["workplace stress", "boundary setting", "self-compassion"],
      emotionalThemes: ["overwhelm", "determination", "hopefulness"],
      suggestedActions: [
        "Try a 5-minute breathing exercise",
        "Journal about your boundaries",
        "Connect with the Burnout Recovery community",
      ],
      overallSentiment: "neutral",
      summary: "You shared feelings of work-related stress and explored strategies for setting healthier boundaries. There's a notable shift toward hope and self-compassion by the end of the conversation.",
    };
  },

  /**
   * POST /ai/affirmation
   * Generates an affirmation based on conversation context.
   */
  async generateAffirmationFromChat(): Promise<string> {
    await delay(1000);

    return "I am navigating challenges with wisdom and grace. Every difficulty I face is shaping me into someone stronger.";
  },
};

/** Returns a contextual response based on message content */
function getContextualResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("anxious") || lower.includes("anxiety") || lower.includes("panic")) {
    return "I hear that you're feeling anxious. That takes courage to name. Anxiety often tries to warn us about something — can you tell me more about what's been triggering it? We can work through this together.";
  }

  if (lower.includes("sad") || lower.includes("depressed") || lower.includes("hopeless")) {
    return "Thank you for trusting me with that. Sadness is one of the most human experiences, and it deserves to be met with gentleness. How long have you been feeling this way? And is there someone in your life you've been able to talk to?";
  }

  if (lower.includes("stress") || lower.includes("overwhelm") || lower.includes("burnout")) {
    return "It sounds like you're carrying a lot right now. Burnout and overwhelm are real — they're not weakness, they're signals. Let's slow down for a second. What feels most heavy for you right now?";
  }

  if (lower.includes("happy") || lower.includes("great") || lower.includes("good")) {
    return "I love hearing that! It's worth pausing to really take that in. What's been contributing to you feeling this way? Understanding our positive states helps us return to them when things get harder.";
  }

  if (lower.includes("journal") || lower.includes("write")) {
    return "Journaling is such a powerful practice. I'd love to help you get started. Want me to suggest a prompt, or would you prefer to write freely today?";
  }

  if (lower.includes("sleep") || lower.includes("tired") || lower.includes("exhausted")) {
    return "Rest is foundational to everything — mood, cognition, emotional regulation. When we're sleep-deprived, everything feels harder. Tell me more about what your sleep has been like lately.";
  }

  // Default responses
  return MOCK_AI_RESPONSES[Math.floor(Math.random() * MOCK_AI_RESPONSES.length)];
}

function getRandomSuggestions(): string[] {
  const shuffled = [...MOCK_SUGGESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}
