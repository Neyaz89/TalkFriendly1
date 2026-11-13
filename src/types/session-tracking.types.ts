/**
 * Session Tracking Types
 * Manual attendance tracking for appointments
 */

// ============================================================================
// Enums
// ============================================================================

export type ParticipantRole = 'patient' | 'psychiatrist' | 'listener' | 'user';

export type SessionSource = 
  | 'manual_check_in'      // User manually checked in
  | 'manual_adjustment'    // Admin adjusted session times
  | 'frontend_tracking';   // Tracked by frontend (future)

export type AttendanceStatus = 
  | 'not_started'
  | 'listener_present'
  | 'user_present'
  | 'both_present'
  | 'completed';

// ============================================================================
// Database Types
// ============================================================================

export interface ParticipantSession {
  id: string;
  appointment_id: string;
  user_id: string;
  participant_role: ParticipantRole;
  joined_at: string; // ISO timestamp
  left_at: string | null; // ISO timestamp
  duration_seconds: number | null;
  source: SessionSource;
  google_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipantSessionInsert {
  appointment_id: string;
  user_id: string;
  participant_role: ParticipantRole;
  joined_at: string;
  left_at?: string;
  source: SessionSource;
}

export interface ParticipantSessionUpdate {
  left_at?: string;
  duration_seconds?: number;
  updated_at?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CheckInRequest {
  appointment_id: string;
  // participant_role inferred from auth
}

export interface CheckOutRequest {
  appointment_id: string;
  // participant_role inferred from auth
}

export interface CheckInResponse {
  success: boolean;
  session: ParticipantSession;
  message: string;
}

export interface CheckOutResponse {
  success: boolean;
  session: ParticipantSession;
  duration_minutes: number;
  message: string;
}

export interface SessionStatusResponse {
  appointment_id: string;
  listener_checked_in: boolean;
  user_checked_in: boolean;
  listener_session: ParticipantSession | null;
  user_session: ParticipantSession | null;
  overlapping_duration_minutes: number | null;
  status: AttendanceStatus;
}

// ============================================================================
// Duration Calculation Types
// ============================================================================

export interface TimeInterval {
  start: Date;
  end: Date;
}

export interface SessionDuration {
  listener_total_minutes: number;
  user_total_minutes: number;
  overlapping_minutes: number;
  billable_minutes: number; // Based on overlapping time
}

export interface ListenerSessionHistory {
  listener_id: string;
  listener_name: string;
  total_sessions: number;
  total_hours: number;
  completed_sessions: number;
  average_session_duration_minutes: number;
  recent_sessions: SessionHistoryItem[];
}

export interface SessionHistoryItem {
  appointment_id: string;
  user_id: string;
  user_name: string;
  scheduled_time: string;
  joined_at: string;
  left_at: string | null;
  duration_minutes: number | null;
  overlapping_duration_minutes: number | null;
  status: string;
}

// ============================================================================
// Admin Review Types
// ============================================================================

export interface SessionReviewData {
  appointment_id: string;
  scheduled_time: string;
  listener_id: string;
  listener_name: string;
  user_id: string;
  user_name: string;
  listener_sessions: ParticipantSession[];
  user_sessions: ParticipantSession[];
  total_duration_minutes: number;
  overlapping_duration_minutes: number;
  requires_review: boolean;
  review_notes: string | null;
}

export interface SessionAdjustmentRequest {
  session_id: string;
  joined_at?: string;
  left_at?: string;
  reason: string;
}

export interface SessionAdjustmentResponse {
  success: boolean;
  session: ParticipantSession;
  message: string;
}

// ============================================================================
// Statistics Types
// ============================================================================

export interface SessionStatistics {
  total_sessions: number;
  total_duration_hours: number;
  average_duration_minutes: number;
  completed_sessions: number;
  incomplete_sessions: number;
  sessions_by_status: Record<AttendanceStatus, number>;
  sessions_by_month: Array<{
    month: string;
    count: number;
    total_hours: number;
  }>;
}
