/**
 * Google Meet integration and attendance tracking types.
 */

// ============================================================================
// Google Meet Conference
// ============================================================================

export interface GoogleMeetConference {
  id: string;
  appointment_id: string;
  
  // Google Meet Identifiers
  space_name: string; // spaces/SPACE_ID
  meeting_uri: string;
  meeting_code: string | null;
  conference_record_name: string | null; // conferenceRecords/RECORD_ID
  
  // State
  conference_state: ConferenceState;
  
  // Timestamps from Google
  google_start_time: string | null;
  google_end_time: string | null;
  
  // Reconciliation
  reconciliation_status: ReconciliationStatus;
  reconciliation_attempted_at: string | null;
  reconciliation_completed_at: string | null;
  reconciliation_error: string | null;
  reconciliation_attempts: number;
  
  created_at: string;
  updated_at: string;
}

export type ConferenceState = 'created' | 'active' | 'ended' | 'reconciled';

export type ReconciliationStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'manual_review_required';

// ============================================================================
// Google Meet API Types (from googleapis)
// ============================================================================

export interface GoogleMeetSpace {
  name: string; // spaces/{space}
  meetingUri: string;
  meetingCode: string;
  config?: {
    accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED';
    entryPointAccess?: 'ALL' | 'CREATOR_APP_ONLY';
  };
  activeConference?: {
    conferenceRecord: string;
  };
}

export interface GoogleConferenceRecord {
  name: string; // conferenceRecords/{conferenceRecord}
  startTime: string;
  endTime: string;
  space: string;
}

export interface GoogleParticipantSession {
  name: string; // conferenceRecords/{conferenceRecord}/participantSessions/{participantSession}
  startTime: string;
  endTime: string;
  participant: string; // conferenceRecords/{conferenceRecord}/participants/{participant}
}

export interface GoogleParticipant {
  name: string; // conferenceRecords/{conferenceRecord}/participants/{participant}
  earliestStartTime: string;
  latestEndTime: string;
  signalingId: string;
  phoneUser?: {
    displayName: string;
  };
  anonymousUser?: {
    displayName: string;
  };
  user?: {
    displayName: string;
    user: string; // users/{user}
  };
}

// ============================================================================
// Create Meeting Payload
// ============================================================================

export interface CreateMeetingPayload {
  appointment_id: string;
}

export interface CreateMeetingResponse {
  space_name: string;
  meeting_uri: string;
  meeting_code: string | null;
}

// ============================================================================
// Attendance Events
// ============================================================================

export interface AttendanceEvent {
  id: string;
  appointment_id: string;
  
  // Event Identity
  event_id: string;
  event_type: AttendanceEventType;
  event_timestamp: string;
  
  // Participant Information
  google_participant_id: string | null;
  participant_display_name: string | null;
  participant_email: string | null;
  
  // Mapping
  mapped_user_id: string | null;
  mapping_confidence: MappingConfidence;
  
  // Session
  google_session_id: string | null;
  
  // Raw Data
  raw_event_data: Record<string, any> | null;
  
  // Processing
  processed_at: string;
  is_duplicate: boolean;
  
  created_at: string;
}

export type AttendanceEventType =
  | 'conference_started'
  | 'conference_ended'
  | 'participant_joined'
  | 'participant_left';

export type MappingConfidence = 'verified' | 'probable' | 'unknown';

// ============================================================================
// Participant Sessions
// ============================================================================

export interface ParticipantSession {
  id: string;
  appointment_id: string;
  user_id: string;
  
  // Role
  participant_role: 'patient' | 'psychiatrist';
  
  // Time Interval
  joined_at: string;
  left_at: string | null;
  
  // Duration (calculated)
  duration_seconds: number | null;
  
  // Source
  source: ParticipantSessionSource;
  google_session_id: string | null;
  
  created_at: string;
  updated_at: string;
}

export type ParticipantSessionSource = 
  | 'google_meet'
  | 'manual_adjustment'
  | 'frontend_tracking';

// ============================================================================
// Attendance Reconciliation
// ============================================================================

export interface ReconciliationRequest {
  appointment_id: string;
  force?: boolean; // Force reconciliation even if already completed
}

export interface ReconciliationResult {
  appointment_id: string;
  success: boolean;
  conference_record_found: boolean;
  participant_sessions_count: number;
  patient_attended: boolean;
  psychiatrist_attended: boolean;
  billable_duration_minutes: number;
  errors: string[];
  warnings: string[];
}

export interface BillableDurationCalculation {
  appointment_id: string;
  patient_sessions: TimeInterval[];
  psychiatrist_sessions: TimeInterval[];
  overlapping_intervals: TimeInterval[];
  total_billable_seconds: number;
  total_billable_minutes: number;
}

export interface TimeInterval {
  start: string; // ISO 8601
  end: string;
  duration_seconds: number;
}

// ============================================================================
// Webhook Events
// ============================================================================

export interface GoogleMeetWebhookEvent {
  eventType: string;
  notificationMetadata: {
    eventTime: string;
    resourceName: string;
  };
  conferenceStarted?: ConferenceStartedEvent;
  conferenceEnded?: ConferenceEndedEvent;
  participantJoined?: ParticipantJoinedEvent;
  participantLeft?: ParticipantLeftEvent;
}

export interface ConferenceStartedEvent {
  space: string;
  conferenceRecord: string;
  startTime: string;
}

export interface ConferenceEndedEvent {
  space: string;
  conferenceRecord: string;
  endTime: string;
}

export interface ParticipantJoinedEvent {
  space: string;
  conferenceRecord: string;
  participant: string;
  participantSession: string;
  startTime: string;
}

export interface ParticipantLeftEvent {
  space: string;
  conferenceRecord: string;
  participant: string;
  participantSession: string;
  endTime: string;
}

// ============================================================================
// Webhook Processing
// ============================================================================

export interface ProcessWebhookPayload {
  event: GoogleMeetWebhookEvent;
  signature?: string;
}

export interface ProcessWebhookResponse {
  success: boolean;
  event_type: string;
  appointment_id: string | null;
  action_taken: string;
  errors: string[];
}

// ============================================================================
// Participant Mapping
// ============================================================================

export interface ParticipantMappingRequest {
  google_participant_id: string;
  participant_email: string | null;
  participant_display_name: string | null;
  appointment_id: string;
}

export interface ParticipantMappingResult {
  mapped_user_id: string | null;
  confidence: MappingConfidence;
  matching_method: 'email' | 'name' | 'none';
  candidate_users?: Array<{
    user_id: string;
    username: string;
    email: string;
    match_score: number;
  }>;
}

// ============================================================================
// Google OAuth & Configuration
// ============================================================================

export interface GoogleMeetConfig {
  projectId: string;
  serviceAccountEmail: string;
  privateKey: string;
  webhookSecret: string;
}

export interface GoogleAuthCredentials {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AttendanceEventsResponse {
  events: AttendanceEvent[];
  total: number;
}

export interface ParticipantSessionsResponse {
  sessions: ParticipantSession[];
  patient_total_minutes: number;
  psychiatrist_total_minutes: number;
  overlapping_minutes: number;
}
