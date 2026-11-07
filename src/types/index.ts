/**
 * Central type exports for the TalkFriendly application.
 * All shared TypeScript interfaces and types live here.
 */

export * from "./auth.types";
export * from "./user.types";
export * from "./mood.types";
export * from "./journal.types";
export * from "./listener.types";
export * from "./community.types";
export * from "./booking.types";
export * from "./event.types";
export * from "./affirmation.types";
// Re-export ai.types but exclude conflicting names (Conversation, SendMessagePayload)
// which are also defined in connections.types
export {
  type ChatMessage,
  type ChatAction,
  type AiInsight,
  type ConversationSummary,
} from "./ai.types";
export * from "./dashboard.types";
export * from "./connection.types";
export * from "./doctor.types";
export * from "./feed.types";
// Note: chat.types is not exported here to avoid conflicts with connections.types
// Import directly from '@/types/chat.types' if you need the database-specific types
export * from "./notification.types";
export * from "./block.types";
export * from "./report.types";

// Appointment System Types
export * from "./appointment.types";
export * from "./google-meet.types";
export * from "./financial.types";

// Connections and Messaging System (this includes Message and Conversation types)
export * from "./connections.types";

// Admin System & Listener Applications
export * from "./admin.types";
export * from "./listener-application.types";
