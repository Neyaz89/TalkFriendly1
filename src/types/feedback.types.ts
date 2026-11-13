/**
 * Feedback and rating types for session evaluation.
 * Listeners can request feedback after sessions are completed.
 */

// ─── Rating Scale ─────────────────────────────────────────────────────────────

export type RatingValue = 1 | 2 | 3 | 4 | 5;

export interface RatingCategory {
  name: string;
  label: string;
  description?: string;
  rating: RatingValue | null;
}

// ─── Feedback Request ─────────────────────────────────────────────────────────

export type FeedbackRequestStatus = 'pending' | 'submitted' | 'expired';

export interface FeedbackRequest {
  id: string;
  message_id: string; // Link to the message that contains this request
  conversation_id: string;
  session_id?: string; // Optional link to specific session
  requested_by: string; // listener_id
  requested_from: string; // user_id
  categories: string[]; // e.g., ['communication', 'helpfulness', 'professionalism']
  custom_questions?: string[]; // Optional additional questions
  status: FeedbackRequestStatus;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export type FeedbackRequestInsert = Omit<FeedbackRequest, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type FeedbackRequestUpdate = Partial<FeedbackRequestInsert>;

// ─── Feedback Response ────────────────────────────────────────────────────────

export interface FeedbackResponse {
  id: string;
  feedback_request_id: string;
  session_id?: string;
  listener_id: string;
  user_id: string;
  overall_rating: RatingValue;
  category_ratings: RatingCategory[];
  custom_responses?: { question: string; answer: string }[];
  comment?: string;
  is_anonymous: boolean;
  is_public: boolean; // Whether to display on listener's public profile
  created_at: string;
  updated_at: string;
}

export type FeedbackResponseInsert = Omit<FeedbackResponse, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type FeedbackResponseUpdate = Partial<FeedbackResponseInsert>;

// ─── Feedback Message Payload ─────────────────────────────────────────────────

/**
 * This is stored in message.content as JSON when message_type = 'feedback_request'
 */
export interface FeedbackMessagePayload {
  feedback_request_id: string;
  session_id?: string;
  categories: string[];
  custom_questions?: string[];
  expires_at?: string;
  feedback_response_id?: string; // Set after user submits
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface SendFeedbackRequestPayload {
  conversation_id: string;
  session_id?: string;
  categories?: string[]; // Defaults to standard categories if not provided
  custom_questions?: string[];
  expires_in_days?: number; // Defaults to 7 days
}

export interface SubmitFeedbackPayload {
  feedback_request_id: string;
  overall_rating: RatingValue;
  category_ratings: RatingCategory[];
  custom_responses?: { question: string; answer: string }[];
  comment?: string;
  is_anonymous?: boolean;
  is_public?: boolean;
}

// ─── Standard Categories ──────────────────────────────────────────────────────

export const STANDARD_FEEDBACK_CATEGORIES = [
  {
    name: 'communication',
    label: 'Communication',
    description: 'How well did the listener communicate?',
  },
  {
    name: 'helpfulness',
    label: 'Helpfulness',
    description: 'How helpful was the session?',
  },
  {
    name: 'professionalism',
    label: 'Professionalism',
    description: 'How professional was the listener?',
  },
  {
    name: 'empathy',
    label: 'Empathy',
    description: 'How empathetic was the listener?',
  },
] as const;
