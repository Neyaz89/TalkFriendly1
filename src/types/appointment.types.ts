/**
 * Appointment and session booking related TypeScript types.
 * Supports both immediate and scheduled psychiatrist consultations.
 */

import type { Database } from './database.types';

// ============================================================================
// Database Row Types (Auto-generated from Supabase schema)
// ============================================================================

export type AppointmentRow = Database['public']['Tables']['appointments']['Row'];
export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

// ============================================================================
// Appointment Status & Types
// ============================================================================

export type AppointmentStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'scheduled'
  | 'ready'
  | 'in_progress'
  | 'interrupted'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'attendance_pending'
  | 'disputed';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type BookingType = 'immediate' | 'scheduled';

export type SessionDuration = 15 | 30 | 60;

// ============================================================================
// Appointment Core Types
// ============================================================================

export interface Appointment {
  id: string;
  patient_id: string;
  psychiatrist_id: string;
  doctor_profile_id: string;
  
  // Scheduling
  scheduled_start_time: string; // ISO 8601
  scheduled_end_time: string;
  duration_minutes: SessionDuration;
  timezone: string;
  
  // Type
  booking_type: BookingType;
  
  // Google Meet
  google_meet_space_name: string | null;
  google_meet_uri: string | null;
  google_conference_id: string | null;
  
  // Pricing
  price_snapshot: PriceSnapshot;
  
  // Status
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  
  // Payment
  payment_transaction_id: string | null;
  
  // Timestamps
  actual_start_time: string | null;
  actual_end_time: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  
  // Notes
  patient_notes: string | null;
  internal_notes: string | null;
}

export interface PriceSnapshot {
  amount: number; // in dollars (e.g., 60.00)
  currency: string; // 'USD'
  commission_rate: number; // decimal (e.g., 0.20 for 20%)
  duration_minutes: SessionDuration;
  timestamp: string; // When snapshot was taken
}

// ============================================================================
// Appointment with Relations
// ============================================================================

export interface AppointmentWithDetails extends Appointment {
  patient?: {
    id: string;
    username: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  psychiatrist?: {
    id: string;
    username: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  doctor_profile?: {
    id: string;
    name: string;
    professional_title: string | null;
    specialization: string[];
    rating: number;
    avatar_url: string | null;
  };
  google_meet_conference?: GoogleMeetConference;
  session_financials?: SessionFinancial;
}

// ============================================================================
// Create & Update Payloads
// ============================================================================

export interface CreateAppointmentPayload {
  psychiatrist_id: string;
  doctor_profile_id: string;
  booking_type: BookingType;
  
  // For scheduled bookings
  scheduled_start_time?: string; // ISO 8601
  
  // Duration selection
  duration_minutes: SessionDuration;
  
  // Timezone
  timezone: string;
  
  // Optional notes
  patient_notes?: string;
}

export interface CreateImmediateAppointmentPayload {
  psychiatrist_id: string;
  doctor_profile_id: string;
  duration_minutes: SessionDuration;
  timezone: string;
  patient_notes?: string;
}

export interface CreateScheduledAppointmentPayload {
  psychiatrist_id: string;
  doctor_profile_id: string;
  scheduled_start_time: string; // ISO 8601
  duration_minutes: SessionDuration;
  timezone: string;
  patient_notes?: string;
}

export interface UpdateAppointmentPayload {
  status?: AppointmentStatus;
  payment_status?: PaymentStatus;
  payment_transaction_id?: string;
  actual_start_time?: string;
  actual_end_time?: string;
  cancellation_reason?: string;
  internal_notes?: string;
}

export interface CancelAppointmentPayload {
  cancellation_reason: string;
}

export interface ExtendAppointmentPayload {
  additional_minutes: SessionDuration;
  payment_transaction_id: string;
}

// ============================================================================
// Availability Types
// ============================================================================

export interface PsychiatristAvailability {
  id: string;
  psychiatrist_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM format
  end_time: string;
  timezone: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySlot {
  slot_start_time: string; // ISO 8601
  slot_end_time: string;
  is_available: boolean;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  slots: AvailabilitySlot[];
}

export interface SetAvailabilityPayload {
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone: string;
  notes?: string;
}

export interface UpdateAvailabilityPayload {
  start_time?: string;
  end_time?: string;
  timezone?: string;
  is_active?: boolean;
  notes?: string;
}

// ============================================================================
// Appointment Filters & Queries
// ============================================================================

export interface AppointmentFilterParams {
  status?: AppointmentStatus[];
  booking_type?: BookingType;
  from_date?: string;
  to_date?: string;
  patient_id?: string;
  psychiatrist_id?: string;
  payment_status?: PaymentStatus[];
  page?: number;
  limit?: number;
}

export interface PsychiatristAvailabilityQuery {
  psychiatrist_id: string;
  date: string; // YYYY-MM-DD
  duration_minutes: SessionDuration;
  timezone?: string;
}

export interface AvailableNowQuery {
  specialization?: string[];
  min_rating?: number;
  limit?: number;
}

// ============================================================================
// Session Management
// ============================================================================

export interface SessionStatus {
  appointment_id: string;
  status: AppointmentStatus;
  can_join: boolean;
  join_window_open: boolean;
  minutes_until_start: number | null;
  minutes_elapsed: number | null;
  participants_present: {
    patient: boolean;
    psychiatrist: boolean;
  };
}

export interface JoinSessionPayload {
  appointment_id: string;
}

export interface LeaveSessionPayload {
  appointment_id: string;
}

// ============================================================================
// Meeting Access
// ============================================================================

export interface MeetingDetails {
  appointment_id: string;
  meeting_uri: string;
  meeting_code: string | null;
  can_join: boolean;
  join_window_opens_at: string | null;
  other_participant: {
    name: string;
    avatar_url: string | null;
    role: 'patient' | 'psychiatrist';
  };
}

// ============================================================================
// Appointment Statistics
// ============================================================================

export interface AppointmentStats {
  total_appointments: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  no_show: number;
  total_minutes: number;
  total_revenue?: number; // For psychiatrists
}

// ============================================================================
// Response Types
// ============================================================================

export interface CreateAppointmentResponse {
  appointment: AppointmentWithDetails;
  meeting_uri: string;
  payment_required: boolean;
  payment_amount: number;
  payment_currency: string;
}

export interface AppointmentListResponse {
  appointments: AppointmentWithDetails[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface AvailableSlotsResponse {
  psychiatrist_id: string;
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
}

export interface AvailablePsychiatristsResponse {
  psychiatrists: Array<{
    id: string;
    user_id: string;
    name: string;
    professional_title: string | null;
    specialization: string[];
    rating: number;
    avatar_url: string | null;
    consultation_fee: number;
    is_available_now: boolean;
  }>;
  total: number;
}
