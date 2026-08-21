/**
 * Mock AI conversation data for development.
 */

import type { Conversation, AiInsight } from "@/types";

export const MOCK_AI_RESPONSES = [
  "I hear you. That sounds genuinely difficult, and I want you to know it's okay to feel that way.",
  "Thank you for sharing that with me. It takes courage to name what we're feeling.",
  "That's a really important insight. What do you think it means for how you want to move forward?",
  "I notice you've been carrying a lot lately. What would feel most supportive right now?",
  "It sounds like your anxiety is trying to protect you in some way. What do you think it's afraid of?",
  "That's a beautiful observation about yourself. You clearly have a lot of self-awareness.",
  "What would you say to a good friend who was experiencing what you're going through?",
  "Let's slow down for a moment. Take a breath. What's one thing you can appreciate about this present moment?",
  "I'm curious — when did you first start noticing this pattern?",
  "That resilience you're showing, even when you don't feel resilient, is remarkable.",
];

export const MOCK_SUGGESTIONS = [
  "Tell me more about that",
  "How long have you felt this way?",
  "What would help right now?",
  "I'd like to journal about this",
  "Can you suggest an affirmation?",
  "What communities might help?",
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "conv_001",
    userId: "user_001",
    title: "Processing work stress",
    messages: [
      {
        id: "msg_001",
        role: "user",
        content: "I've been feeling really overwhelmed with work lately and I don't know how to handle it.",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "msg_002",
        role: "assistant",
        content: "I hear you. That sounds genuinely difficult — feeling overwhelmed at work can affect everything else in your life. Can you tell me more about what's been happening? Is it the volume of work, the type of work, or something about the environment?",
        timestamp: new Date(Date.now() - 3600000 * 24 + 30000).toISOString(),
        suggestions: ["It's the volume", "It's my manager", "I feel undervalued", "All of the above"],
      },
    ],
    moodBefore: 2,
    moodAfter: 3,
    tags: ["work", "stress", "overwhelm"],
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
];

export const MOCK_AI_INSIGHTS: AiInsight[] = [
  {
    id: "insight_001",
    type: "mood",
    title: "Your mood improves after social connection",
    description: "Looking at your last 2 weeks, your mood scores are consistently higher on days when you've interacted with the community or had a listener session.",
    actionLabel: "Find a Listener",
    actionType: "listener",
    generatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "insight_002",
    type: "pattern",
    title: "Tuesday tends to be your hardest day",
    description: "Your check-in data shows stress levels peak on Tuesdays. Consider scheduling lighter activities or extra self-care on Tuesdays.",
    actionLabel: "Schedule a Check-in",
    actionType: "checkin",
    generatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "insight_003",
    type: "streak",
    title: "14-day check-in streak 🔥",
    description: "You've checked in 14 days in a row! Research shows consistent mood tracking significantly improves emotional regulation over time.",
    generatedAt: new Date().toISOString(),
  },
];
