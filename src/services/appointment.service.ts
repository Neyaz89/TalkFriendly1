/**
 * Appointment Scheduling Service
 * 
 * Handles:
 * - Creating immediate and scheduled appointments
 * - Checking psychiatrist availability
 * - Managing availability schedules
 * - Validating bookings
 * - Updating appointment status
 */

import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { googleMeetService } from './google-meet.service';
import {
  createAppointmentTimestamp,
  isAppointmentInFuture,
  getUserTimezone,
} from '@/lib/timezone.utils';
import type {
  Appointment,
  AppointmentWithDetails,
  CreateImmediateAppointmentPayload,
  CreateScheduledAppointmentPayload,
  UpdateAppointmentPayload,
  CancelAppointmentPayload,
  AppointmentFilterParams,
  PsychiatristAvailability,
  AvailabilitySlot,
  SetAvailabilityPayload,
  UpdateAvailabilityPayload,
  SessionDuration,
  PriceSnapshot,
  CreateAppointmentResponse,
  AppointmentListResponse,
  AvailableSlotsResponse,
} from '@/types';

// ============================================================================
// Configuration
// ============================================================================

const SESSION_PRICING: Record<SessionDuration, number> = {
  15: parseFloat(process.env.SESSION_PRICE_15_MIN || '1500') / 100, // Convert cents to dollars
  30: parseFloat(process.env.SESSION_PRICE_30_MIN || '3000') / 100,
  60: parseFloat(process.env.SESSION_PRICE_60_MIN || '6000') / 100,
};

const PLATFORM_COMMISSION_RATE = parseFloat(
  process.env.PLATFORM_COMMISSION_RATE || '0.20'
);

const SESSION_JOIN_WINDOW_MINUTES = parseInt(
  process.env.SESSION_JOIN_WINDOW_MINUTES || '15',
  10
);

// ============================================================================
// Pricing Functions
// ============================================================================

function createPriceSnapshot(durationMinutes: SessionDuration): PriceSnapshot {
  return {
    amount: SESSION_PRICING[durationMinutes],
    currency: 'USD',
    commission_rate: PLATFORM_COMMISSION_RATE,
    duration_minutes: durationMinutes,
    timestamp: new Date().toISOString(),
  };
}

function getSessionPrice(durationMinutes: SessionDuration): number {
  return SESSION_PRICING[durationMinutes];
}

// ============================================================================
// Service Functions
// ============================================================================

export const appointmentService = {
  /**
   * Create an immediate appointment ("Start Now")
   */
  async createImmediateAppointment(
    payload: CreateImmediateAppointmentPayload,
    useServerClient: boolean = false
  ): Promise<CreateAppointmentResponse> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Validate psychiatrist is available now
    const isAvailable = await this.checkPsychiatristAvailableNow(
      payload.psychiatrist_id
    );

    if (!isAvailable) {
      throw new Error('Psychiatrist is not available for immediate sessions');
    }

    // Calculate start and end times (immediate = now)
    const now = new Date();
    const scheduledStartTime = now.toISOString();
    const scheduledEndTime = new Date(
      now.getTime() + payload.duration_minutes * 60000
    ).toISOString();

    // Create price snapshot
    const priceSnapshot = createPriceSnapshot(payload.duration_minutes);

    // Create appointment record
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: user.id,
        psychiatrist_id: payload.psychiatrist_id,
        doctor_profile_id: payload.doctor_profile_id,
        scheduled_start_time: scheduledStartTime,
        scheduled_end_time: scheduledEndTime,
        duration_minutes: payload.duration_minutes,
        timezone: payload.timezone || getUserTimezone(),
        booking_type: 'immediate',
        price_snapshot: priceSnapshot,
        status: 'pending_payment',
        patient_notes: payload.patient_notes,
      })
      .select()
      .single();

    if (appointmentError) {
      throw new Error(`Failed to create appointment: ${appointmentError.message}`);
    }

    // Create Google Meet meeting
    try {
      const meetingDetails = await googleMeetService.createMeeting(appointment.id);

      // Update appointment with meeting details
      await supabase
        .from('appointments')
        .update({
          google_meet_space_name: meetingDetails.space_name,
          google_meet_uri: meetingDetails.meeting_uri,
        })
        .eq('id', appointment.id);

      // Create google_meet_conferences record
      await supabase.from('google_meet_conferences').insert({
        appointment_id: appointment.id,
        space_name: meetingDetails.space_name,
        meeting_uri: meetingDetails.meeting_uri,
        meeting_code: meetingDetails.meeting_code,
        conference_state: 'created',
      });

      return {
        appointment: {
          ...appointment,
          google_meet_uri: meetingDetails.meeting_uri,
        } as AppointmentWithDetails,
        meeting_uri: meetingDetails.meeting_uri,
        payment_required: true,
        payment_amount: priceSnapshot.amount,
        payment_currency: priceSnapshot.currency,
      };
    } catch (meetError) {
      console.error('Failed to create Google Meet:', meetError);
      
      // Still return appointment but flag meeting creation failed
      return {
        appointment: appointment as AppointmentWithDetails,
        meeting_uri: '',
        payment_required: true,
        payment_amount: priceSnapshot.amount,
        payment_currency: priceSnapshot.currency,
      };
    }
  },

  /**
   * Create a scheduled appointment ("Schedule a Call")
   */
  async createScheduledAppointment(
    payload: CreateScheduledAppointmentPayload,
    useServerClient: boolean = false
  ): Promise<CreateAppointmentResponse> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Validate appointment is in the future
    if (!isAppointmentInFuture(payload.scheduled_start_time, 60)) {
      throw new Error('Appointment must be scheduled at least 60 minutes in the future');
    }

    // Calculate end time
    const startTime = new Date(payload.scheduled_start_time);
    const endTime = new Date(
      startTime.getTime() + payload.duration_minutes * 60000
    );

    // Check for overlapping appointments
    const hasOverlap = await this.checkForOverlappingAppointments(
      payload.psychiatrist_id,
      payload.scheduled_start_time,
      endTime.toISOString()
    );

    if (hasOverlap) {
      throw new Error('This time slot is no longer available');
    }

    // Create price snapshot
    const priceSnapshot = createPriceSnapshot(payload.duration_minutes);

    // Create appointment record
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: user.id,
        psychiatrist_id: payload.psychiatrist_id,
        doctor_profile_id: payload.doctor_profile_id,
        scheduled_start_time: payload.scheduled_start_time,
        scheduled_end_time: endTime.toISOString(),
        duration_minutes: payload.duration_minutes,
        timezone: payload.timezone || getUserTimezone(),
        booking_type: 'scheduled',
        price_snapshot: priceSnapshot,
        status: 'pending_payment',
        patient_notes: payload.patient_notes,
      })
      .select()
      .single();

    if (appointmentError) {
      throw new Error(`Failed to create appointment: ${appointmentError.message}`);
    }

    // Create Google Meet meeting
    try {
      const meetingDetails = await googleMeetService.createMeeting(appointment.id);

      // Update appointment with meeting details
      await supabase
        .from('appointments')
        .update({
          google_meet_space_name: meetingDetails.space_name,
          google_meet_uri: meetingDetails.meeting_uri,
        })
        .eq('id', appointment.id);

      // Create google_meet_conferences record
      await supabase.from('google_meet_conferences').insert({
        appointment_id: appointment.id,
        space_name: meetingDetails.space_name,
        meeting_uri: meetingDetails.meeting_uri,
        meeting_code: meetingDetails.meeting_code,
        conference_state: 'created',
      });

      return {
        appointment: {
          ...appointment,
          google_meet_uri: meetingDetails.meeting_uri,
        } as AppointmentWithDetails,
        meeting_uri: meetingDetails.meeting_uri,
        payment_required: true,
        payment_amount: priceSnapshot.amount,
        payment_currency: priceSnapshot.currency,
      };
    } catch (meetError) {
      console.error('Failed to create Google Meet:', meetError);
      
      return {
        appointment: appointment as AppointmentWithDetails,
        meeting_uri: '',
        payment_required: true,
        payment_amount: priceSnapshot.amount,
        payment_currency: priceSnapshot.currency,
      };
    }
  },

  /**
   * Get appointments for current user
   */
  async getAppointments(
    filters?: AppointmentFilterParams,
    useServerClient: boolean = false
  ): Promise<AppointmentListResponse> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    let query = supabase
      .from('appointments')
      .select(
        `
        *,
        patient:profiles!patient_id(id, username, full_name, email, avatar_url),
        psychiatrist:profiles!psychiatrist_id(id, username, full_name, email, avatar_url),
        doctor_profile:listeners!doctor_profile_id(id, name, professional_title, specialization, rating, avatar_url),
        google_meet_conference:google_meet_conferences(*),
        session_financials(*)
      `,
        { count: 'exact' }
      )
      .or(`patient_id.eq.${user.id},psychiatrist_id.eq.${user.id}`);

    // Apply filters
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }

    if (filters?.booking_type) {
      query = query.eq('booking_type', filters.booking_type);
    }

    if (filters?.from_date) {
      query = query.gte('scheduled_start_time', filters.from_date);
    }

    if (filters?.to_date) {
      query = query.lte('scheduled_start_time', filters.to_date);
    }

    if (filters?.payment_status && filters.payment_status.length > 0) {
      query = query.in('payment_status', filters.payment_status);
    }

    // Pagination
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
      .range(from, to)
      .order('scheduled_start_time', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    return {
      appointments: (data || []) as AppointmentWithDetails[],
      total: count || 0,
      page,
      limit,
      has_more: count ? from + limit < count : false,
    };
  },

  /**
   * Get a single appointment by ID
   */
  async getAppointmentById(
    appointmentId: string,
    useServerClient: boolean = false
  ): Promise<AppointmentWithDetails> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const { data, error } = await supabase
      .from('appointments')
      .select(
        `
        *,
        patient:profiles!patient_id(id, username, full_name, email, avatar_url),
        psychiatrist:profiles!psychiatrist_id(id, username, full_name, email, avatar_url),
        doctor_profile:listeners!doctor_profile_id(id, name, professional_title, specialization, rating, avatar_url),
        google_meet_conference:google_meet_conferences(*),
        session_financials(*)
      `
      )
      .eq('id', appointmentId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch appointment: ${error.message}`);
    }

    return data as AppointmentWithDetails;
  },

  /**
   * Update appointment
   */
  async updateAppointment(
    appointmentId: string,
    payload: UpdateAppointmentPayload,
    useServerClient: boolean = false
  ): Promise<Appointment> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update appointment: ${error.message}`);
    }

    return data as Appointment;
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    payload: CancelAppointmentPayload,
    useServerClient: boolean = false
  ): Promise<Appointment> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: payload.cancellation_reason,
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }

    return data as Appointment;
  },

  /**
   * Check if psychiatrist is available now
   */
  async checkPsychiatristAvailableNow(
    psychiatristId: string,
    useServerClient: boolean = false
  ): Promise<boolean> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    // Check for any active or upcoming sessions
    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .eq('psychiatrist_id', psychiatristId)
      .in('status', ['in_progress', 'ready', 'scheduled'])
      .gte('scheduled_end_time', new Date().toISOString())
      .limit(1);

    if (error) {
      console.error('Error checking availability:', error);
      return false;
    }

    return !data || data.length === 0;
  },

  /**
   * Check for overlapping appointments
   */
  async checkForOverlappingAppointments(
    psychiatristId: string,
    startTime: string,
    endTime: string,
    useServerClient: boolean = false
  ): Promise<boolean> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const { data, error } = await supabase
      .from('appointments')
      .select('id')
      .eq('psychiatrist_id', psychiatristId)
      .not('status', 'in', '(cancelled,completed)')
      .or(
        `and(scheduled_start_time.lt.${endTime},scheduled_end_time.gt.${startTime})`
      )
      .limit(1);

    if (error) {
      console.error('Error checking overlaps:', error);
      return true; // Assume overlap on error for safety
    }

    return data && data.length > 0;
  },

  /**
   * Get available slots for a psychiatrist on a specific date
   */
  async getAvailableSlots(
    psychiatristId: string,
    date: string, // YYYY-MM-DD
    durationMinutes: SessionDuration,
    timezone: string,
    useServerClient: boolean = false
  ): Promise<AvailableSlotsResponse> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    // Call database function to get available slots
    const { data, error } = await supabase.rpc('get_available_slots', {
      p_psychiatrist_id: psychiatristId,
      p_date: date,
      p_duration_minutes: durationMinutes,
    });

    if (error) {
      throw new Error(`Failed to fetch available slots: ${error.message}`);
    }

    return {
      psychiatrist_id: psychiatristId,
      date,
      timezone,
      slots: (data || []).map((slot: any) => ({
        slot_start_time: slot.slot_start_time,
        slot_end_time: slot.slot_end_time,
        is_available: slot.is_available,
      })),
    };
  },

  /**
   * Set psychiatrist availability
   */
  async setAvailability(
    payload: SetAvailabilityPayload,
    useServerClient: boolean = false
  ): Promise<PsychiatristAvailability> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('psychiatrist_availability')
      .insert({
        psychiatrist_id: user.id,
        day_of_week: payload.day_of_week,
        start_time: payload.start_time,
        end_time: payload.end_time,
        timezone: payload.timezone,
        notes: payload.notes,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to set availability: ${error.message}`);
    }

    return data as PsychiatristAvailability;
  },

  /**
   * Update psychiatrist availability
   */
  async updateAvailability(
    availabilityId: string,
    payload: UpdateAvailabilityPayload,
    useServerClient: boolean = false
  ): Promise<PsychiatristAvailability> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('psychiatrist_availability')
      .update(payload)
      .eq('id', availabilityId)
      .eq('psychiatrist_id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update availability: ${error.message}`);
    }

    return data as PsychiatristAvailability;
  },

  /**
   * Get psychiatrist's availability schedule
   */
  async getAvailabilitySchedule(
    psychiatristId: string,
    useServerClient: boolean = false
  ): Promise<PsychiatristAvailability[]> {
    const supabase = useServerClient
      ? await createServerClient()
      : createBrowserClient();

    const { data, error } = await supabase
      .from('psychiatrist_availability')
      .select('*')
      .eq('psychiatrist_id', psychiatristId)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');

    if (error) {
      throw new Error(`Failed to fetch availability: ${error.message}`);
    }

    return (data || []) as PsychiatristAvailability[];
  },

  /**
   * Get session pricing
   */
  getSessionPricing() {
    return {
      15: SESSION_PRICING[15],
      30: SESSION_PRICING[30],
      60: SESSION_PRICING[60],
      currency: 'USD',
      commission_rate: PLATFORM_COMMISSION_RATE,
    };
  },

  /**
   * Calculate estimated earnings for psychiatrist
   */
  calculateEstimatedEarnings(durationMinutes: SessionDuration): number {
    const baseAmount = SESSION_PRICING[durationMinutes];
    const commission = baseAmount * PLATFORM_COMMISSION_RATE;
    return baseAmount - commission;
  },
};
