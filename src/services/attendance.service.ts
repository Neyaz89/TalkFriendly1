/**
 * Attendance Tracking and Reconciliation Service
 * 
 * Handles:
 * - Processing attendance events from Google Meet
 * - Mapping Google participants to TalkFriendly users
 * - Creating participant session records
 * - Calculating billable overlapping duration
 * - Reconciling with final conference records
 * - Handling incomplete/missing data
 */

import { createClient } from '@/lib/supabase/client';
import type {
  AttendanceEvent,
  ParticipantSession,
  GoogleMeetWebhookEvent,
  ReconciliationRequest,
  ReconciliationResult,
  BillableDurationCalculation,
  TimeInterval,
  ParticipantMappingRequest,
  ParticipantMappingResult,
  ProcessWebhookResponse,
  MappingConfidence,
} from '@/types';

// ============================================================================
// Event Processing
// ============================================================================

export const attendanceService = {
  /**
   * Process a Google Meet webhook event
   */
  async processWebhookEvent(
    event: GoogleMeetWebhookEvent,
    useServerClient: boolean = true
  ): Promise<ProcessWebhookResponse> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    const errors: string[] = [];
    let appointmentId: string | null = null;
    let actionTaken = 'none';

    try {
      // Extract space name from event
      const spaceName = this.extractSpaceNameFromEvent(event);
      if (!spaceName) {
        errors.push('Could not extract space name from event');
        return {
          success: false,
          event_type: event.eventType,
          appointment_id: null,
          action_taken: 'rejected',
          errors,
        };
      }

      // Find appointment by space name
      const { data: conference } = await supabase
        .from('google_meet_conferences')
        .select('appointment_id')
        .eq('space_name', spaceName)
        .single();

      if (!conference) {
        errors.push('No appointment found for this meeting');
        return {
          success: false,
          event_type: event.eventType,
          appointment_id: null,
          action_taken: 'appointment_not_found',
          errors,
        };
      }

      appointmentId = conference.appointment_id;

      // Null check for TypeScript
      if (!appointmentId) {
        errors.push('Appointment ID is null');
        return {
          success: false,
          event_type: event.eventType,
          appointment_id: null,
          action_taken: 'invalid_appointment_id',
          errors,
        };
      }

      // Process based on event type
      if (event.conferenceStarted) {
        await this.handleConferenceStarted(
          appointmentId,
          event.conferenceStarted,
          event
        );
        actionTaken = 'conference_started_recorded';
      } else if (event.conferenceEnded) {
        await this.handleConferenceEnded(
          appointmentId,
          event.conferenceEnded,
          event
        );
        actionTaken = 'conference_ended_recorded';
      } else if (event.participantJoined) {
        await this.handleParticipantJoined(
          appointmentId,
          event.participantJoined,
          event
        );
        actionTaken = 'participant_joined_recorded';
      } else if (event.participantLeft) {
        await this.handleParticipantLeft(
          appointmentId,
          event.participantLeft,
          event
        );
        actionTaken = 'participant_left_recorded';
      } else {
        errors.push('Unknown event type');
        actionTaken = 'unknown_event_type';
      }

      return {
        success: errors.length === 0,
        event_type: event.eventType,
        appointment_id: appointmentId,
        action_taken: actionTaken,
        errors,
      };
    } catch (error) {
      console.error('Error processing webhook event:', error);
      errors.push(`Processing error: ${error}`);
      return {
        success: false,
        event_type: event.eventType,
        appointment_id: appointmentId,
        action_taken: 'error',
        errors,
      };
    }
  },

  /**
   * Handle conference started event
   */
  async handleConferenceStarted(
    appointmentId: string,
    eventData: any,
    rawEvent: GoogleMeetWebhookEvent,
    useServerClient: boolean = true
  ): Promise<void> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    // Store attendance event
    await this.storeAttendanceEvent({
      appointmentId,
      eventId: `conference_started_${appointmentId}_${Date.now()}`,
      eventType: 'conference_started',
      eventTimestamp: eventData.startTime || rawEvent.notificationMetadata.eventTime,
      rawEventData: rawEvent,
    });

    // Update appointment status
    await supabase
      .from('appointments')
      .update({
        status: 'in_progress',
        actual_start_time: eventData.startTime,
      })
      .eq('id', appointmentId);

    // Update conference state
    await supabase
      .from('google_meet_conferences')
      .update({
        conference_state: 'active',
        google_start_time: eventData.startTime,
        conference_record_name: eventData.conferenceRecord,
      })
      .eq('appointment_id', appointmentId);
  },

  /**
   * Handle conference ended event
   */
  async handleConferenceEnded(
    appointmentId: string,
    eventData: any,
    rawEvent: GoogleMeetWebhookEvent,
    useServerClient: boolean = true
  ): Promise<void> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    // Store attendance event
    await this.storeAttendanceEvent({
      appointmentId,
      eventId: `conference_ended_${appointmentId}_${Date.now()}`,
      eventType: 'conference_ended',
      eventTimestamp: eventData.endTime || rawEvent.notificationMetadata.eventTime,
      rawEventData: rawEvent,
    });

    // Update appointment
    await supabase
      .from('appointments')
      .update({
        actual_end_time: eventData.endTime,
      })
      .eq('id', appointmentId);

    // Update conference state
    await supabase
      .from('google_meet_conferences')
      .update({
        conference_state: 'ended',
        google_end_time: eventData.endTime,
      })
      .eq('appointment_id', appointmentId);

    // Trigger reconciliation (async)
    setTimeout(() => {
      this.reconcileAppointmentAttendance({ appointment_id: appointmentId });
    }, 5 * 60 * 1000); // Wait 5 minutes for conference record to be available
  },

  /**
   * Handle participant joined event
   */
  async handleParticipantJoined(
    appointmentId: string,
    eventData: any,
    rawEvent: GoogleMeetWebhookEvent,
    useServerClient: boolean = true
  ): Promise<void> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    // Extract participant info
    const participantId = eventData.participant?.split('/').pop() || 'unknown';
    const sessionId = eventData.participantSession?.split('/').pop() || null;

    // Store attendance event
    const attendanceEvent = await this.storeAttendanceEvent({
      appointmentId,
      eventId: `participant_joined_${sessionId}_${Date.now()}`,
      eventType: 'participant_joined',
      eventTimestamp: eventData.startTime || rawEvent.notificationMetadata.eventTime,
      googleParticipantId: participantId,
      googleSessionId: sessionId,
      rawEventData: rawEvent,
    });

    // Try to map participant to user
    if (attendanceEvent) {
      await this.mapParticipantToUser(appointmentId, attendanceEvent.id);
    }
  },

  /**
   * Handle participant left event
   */
  async handleParticipantLeft(
    appointmentId: string,
    eventData: any,
    rawEvent: GoogleMeetWebhookEvent,
    useServerClient: boolean = true
  ): Promise<void> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    const participantId = eventData.participant?.split('/').pop() || 'unknown';
    const sessionId = eventData.participantSession?.split('/').pop() || null;

    // Store attendance event
    await this.storeAttendanceEvent({
      appointmentId,
      eventId: `participant_left_${sessionId}_${Date.now()}`,
      eventType: 'participant_left',
      eventTimestamp: eventData.endTime || rawEvent.notificationMetadata.eventTime,
      googleParticipantId: participantId,
      googleSessionId: sessionId,
      rawEventData: rawEvent,
    });

    // Update participant session with left time
    if (sessionId) {
      await supabase
        .from('participant_sessions')
        .update({
          left_at: eventData.endTime,
        })
        .eq('google_session_id', sessionId)
        .eq('appointment_id', appointmentId);
    }
  },

  /**
   * Store an attendance event (idempotent)
   */
  async storeAttendanceEvent(
    data: {
      appointmentId: string;
      eventId: string;
      eventType: 'conference_started' | 'conference_ended' | 'participant_joined' | 'participant_left';
      eventTimestamp: string;
      googleParticipantId?: string;
      participantDisplayName?: string;
      participantEmail?: string;
      googleSessionId?: string;
      rawEventData?: any;
    },
    useServerClient: boolean = true
  ): Promise<AttendanceEvent | null> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    // Check if event already exists (idempotent)
    const { data: existing } = await supabase
      .from('attendance_events')
      .select('id')
      .eq('event_id', data.eventId)
      .eq('appointment_id', data.appointmentId)
      .single();

    if (existing) {
      // Mark as duplicate
      await supabase
        .from('attendance_events')
        .update({ is_duplicate: true })
        .eq('id', existing.id);
      
      return null; // Already processed
    }

    // Insert new event
    const { data: event, error } = await supabase
      .from('attendance_events')
      .insert({
        appointment_id: data.appointmentId,
        event_id: data.eventId,
        event_type: data.eventType,
        event_timestamp: data.eventTimestamp,
        google_participant_id: data.googleParticipantId || null,
        participant_display_name: data.participantDisplayName || null,
        participant_email: data.participantEmail || null,
        google_session_id: data.googleSessionId || null,
        raw_event_data: data.rawEventData || null,
        processed_at: new Date().toISOString(),
        is_duplicate: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing attendance event:', error);
      return null;
    }

    return event as AttendanceEvent;
  },

  /**
   * Map a Google Meet participant to a TalkFriendly user
   */
  async mapParticipantToUser(
    appointmentId: string,
    attendanceEventId: string,
    useServerClient: boolean = true
  ): Promise<void> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    // Get attendance event
    const { data: event } = await supabase
      .from('attendance_events')
      .select('*')
      .eq('id', attendanceEventId)
      .single();

    if (!event || event.mapped_user_id) {
      return; // Already mapped or event not found
    }

    // Get appointment participants
    const { data: appointmentRaw } = await supabase
      .from('appointments')
      .select('patient_id, psychiatrist_id, patient:profiles!patient_id(id, email, full_name), psychiatrist:profiles!psychiatrist_id(id, email, full_name)')
      .eq('id', appointmentId)
      .single();

    if (!appointmentRaw) {
      return;
    }

    // Cast to typed shape - Supabase returns joined relations as arrays but .single() makes them objects
    const appointment = appointmentRaw as unknown as {
      patient_id: string;
      psychiatrist_id: string;
      patient: { id: string; email: string; full_name: string } | null;
      psychiatrist: { id: string; email: string; full_name: string } | null;
    };

    let mappedUserId: string | null = null;
    let confidence: MappingConfidence = 'unknown';

    // Try email matching first (most reliable)
    if (event.participant_email) {
      if (appointment.patient?.email === event.participant_email) {
        mappedUserId = appointment.patient_id;
        confidence = 'verified';
      } else if (appointment.psychiatrist?.email === event.participant_email) {
        mappedUserId = appointment.psychiatrist_id;
        confidence = 'verified';
      }
    }

    // Fallback to display name matching
    if (!mappedUserId && event.participant_display_name) {
      const displayName = event.participant_display_name.toLowerCase();
      
      if (appointment.patient?.full_name?.toLowerCase().includes(displayName) ||
          displayName.includes(appointment.patient?.full_name?.toLowerCase() || '')) {
        mappedUserId = appointment.patient_id;
        confidence = 'probable';
      } else if (appointment.psychiatrist?.full_name?.toLowerCase().includes(displayName) ||
                 displayName.includes(appointment.psychiatrist?.full_name?.toLowerCase() || '')) {
        mappedUserId = appointment.psychiatrist_id;
        confidence = 'probable';
      }
    }

    // Update attendance event with mapping
    await supabase
      .from('attendance_events')
      .update({
        mapped_user_id: mappedUserId,
        mapping_confidence: confidence,
      })
      .eq('id', attendanceEventId);

    // Create or update participant session if mapped
    if (mappedUserId && event.event_type === 'participant_joined') {
      const participantRole = mappedUserId === appointment.patient_id ? 'patient' : 'psychiatrist';

      await supabase
        .from('participant_sessions')
        .insert({
          appointment_id: appointmentId,
          user_id: mappedUserId,
          participant_role: participantRole,
          joined_at: event.event_timestamp,
          source: 'google_meet',
          google_session_id: event.google_session_id,
        });
    }
  },

  /**
   * Reconcile appointment attendance from stored participant sessions
   * Note: Since we use Jitsi (no server-side API), reconciliation is done
   * entirely from the attendance_events and participant_sessions already in DB.
   */
  async reconcileAppointmentAttendance(
    request: ReconciliationRequest,
    useServerClient: boolean = true
  ): Promise<ReconciliationResult> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    const result: ReconciliationResult = {
      appointment_id: request.appointment_id,
      success: false,
      conference_record_found: false,
      participant_sessions_count: 0,
      patient_attended: false,
      psychiatrist_attended: false,
      billable_duration_minutes: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Get appointment details
      const { data: appointment } = await supabase
        .from('appointments')
        .select('*, google_meet_conference:google_meet_conferences(*)')
        .eq('id', request.appointment_id)
        .single();

      if (!appointment) {
        result.errors.push('Appointment not found');
        return result;
      }

      const conference = appointment.google_meet_conference as any;

      // Mark as reconciling
      if (conference?.id) {
        await supabase
          .from('google_meet_conferences')
          .update({
            reconciliation_status: 'in_progress',
            reconciliation_attempted_at: new Date().toISOString(),
            reconciliation_attempts: (conference.reconciliation_attempts || 0) + 1,
          })
          .eq('id', conference.id);
      }

      // Use existing participant_sessions already stored from Jitsi webhook events
      const { data: sessions } = await supabase
        .from('participant_sessions')
        .select('*')
        .eq('appointment_id', request.appointment_id);

      result.conference_record_found = true; // We use local DB records
      result.participant_sessions_count = sessions?.length || 0;

      if (!sessions || sessions.length === 0) {
        result.warnings.push('No participant sessions found in database');
      }

      // Determine attendance from stored sessions
      for (const session of sessions || []) {
        if (session.participant_role === 'patient') result.patient_attended = true;
        if (session.participant_role === 'psychiatrist') result.psychiatrist_attended = true;
      }

      // Calculate billable duration from overlapping sessions
      const billableCalculation = await this.calculateBillableDuration(request.appointment_id);
      result.billable_duration_minutes = billableCalculation.total_billable_minutes;

      // Update appointment status based on attendance
      let newStatus = 'completed';
      if (!result.patient_attended || !result.psychiatrist_attended) {
        newStatus = 'no_show';
      }

      await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', request.appointment_id);

      // Mark reconciliation as complete
      if (conference?.id) {
        await supabase
          .from('google_meet_conferences')
          .update({
            conference_state: 'reconciled',
            reconciliation_status: 'completed',
            reconciliation_completed_at: new Date().toISOString(),
          })
          .eq('id', conference.id);
      }

      result.success = true;
      return result;
    } catch (error) {
      console.error('Reconciliation error:', error);
      result.errors.push(`Reconciliation failed: ${error}`);

      const { data: conference } = await supabase
        .from('google_meet_conferences')
        .select('id')
        .eq('appointment_id', request.appointment_id)
        .single();

      if (conference) {
        await this.markReconciliationFailed(conference.id, String(error));
      }

      return result;
    }
  },

  /**
   * Calculate billable duration from participant sessions
   */
  async calculateBillableDuration(
    appointmentId: string,
    useServerClient: boolean = true
  ): Promise<BillableDurationCalculation> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    // Get all participant sessions
    const { data: sessions } = await supabase
      .from('participant_sessions')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('joined_at');

    const patientSessions: TimeInterval[] = [];
    const psychiatristSessions: TimeInterval[] = [];

    for (const session of sessions || []) {
      if (!session.left_at) continue; // Session not yet ended

      const interval: TimeInterval = {
        start: session.joined_at,
        end: session.left_at,
        duration_seconds:
          (new Date(session.left_at).getTime() - new Date(session.joined_at).getTime()) / 1000,
      };

      if (session.participant_role === 'patient') {
        patientSessions.push(interval);
      } else if (session.participant_role === 'psychiatrist') {
        psychiatristSessions.push(interval);
      }
    }

    // Calculate overlapping intervals
    const overlappingIntervals = this.findOverlappingIntervals(
      patientSessions,
      psychiatristSessions
    );

    // Sum up overlapping duration
    const totalBillableSeconds = overlappingIntervals.reduce(
      (sum, interval) => sum + interval.duration_seconds,
      0
    );

    const totalBillableMinutes = Math.floor(totalBillableSeconds / 60);

    // Update session_financials with billable duration
    await supabase
      .from('session_financials')
      .update({
        actual_duration_minutes: totalBillableMinutes,
        billable_duration_minutes: totalBillableMinutes,
      })
      .eq('appointment_id', appointmentId);

    return {
      appointment_id: appointmentId,
      patient_sessions: patientSessions,
      psychiatrist_sessions: psychiatristSessions,
      overlapping_intervals: overlappingIntervals,
      total_billable_seconds: totalBillableSeconds,
      total_billable_minutes: totalBillableMinutes,
    };
  },

  /**
   * Find overlapping time intervals between two sets of intervals
   */
  findOverlappingIntervals(
    intervals1: TimeInterval[],
    intervals2: TimeInterval[]
  ): TimeInterval[] {
    const overlaps: TimeInterval[] = [];

    for (const i1 of intervals1) {
      for (const i2 of intervals2) {
        const start1 = new Date(i1.start).getTime();
        const end1 = new Date(i1.end).getTime();
        const start2 = new Date(i2.start).getTime();
        const end2 = new Date(i2.end).getTime();

        // Check if intervals overlap
        const overlapStart = Math.max(start1, start2);
        const overlapEnd = Math.min(end1, end2);

        if (overlapStart < overlapEnd) {
          const durationSeconds = (overlapEnd - overlapStart) / 1000;
          overlaps.push({
            start: new Date(overlapStart).toISOString(),
            end: new Date(overlapEnd).toISOString(),
            duration_seconds: durationSeconds,
          });
        }
      }
    }

    return overlaps;
  },

  /**
   * Map Google participant to TalkFriendly user
   */
  async mapGoogleParticipant(
    appointmentId: string,
    googleParticipant: any,
    identity: { email: string | null; displayName: string | null; participantType: string },
    useServerClient: boolean = true
  ): Promise<ParticipantMappingResult> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    // Get appointment participants
    const { data: appointmentRaw2 } = await supabase
      .from('appointments')
      .select('patient_id, psychiatrist_id, patient:profiles!patient_id(id, email, full_name), psychiatrist:profiles!psychiatrist_id(id, email, full_name)')
      .eq('id', appointmentId)
      .single();

    if (!appointmentRaw2) {
      return {
        mapped_user_id: null,
        confidence: 'unknown',
        matching_method: 'none',
      };
    }

    // Cast to typed shape
    const appointment = appointmentRaw2 as unknown as {
      patient_id: string;
      psychiatrist_id: string;
      patient: { id: string; email: string; full_name: string } | null;
      psychiatrist: { id: string; email: string; full_name: string } | null;
    };

    // Try email matching first
    if (identity.email) {
      if (appointment.patient?.email === identity.email) {
        return {
          mapped_user_id: appointment.patient_id,
          confidence: 'verified',
          matching_method: 'email',
        };
      }
      if (appointment.psychiatrist?.email === identity.email) {
        return {
          mapped_user_id: appointment.psychiatrist_id,
          confidence: 'verified',
          matching_method: 'email',
        };
      }
    }

    // Try name matching
    if (identity.displayName) {
      const displayName = identity.displayName.toLowerCase();
      
      if (appointment.patient?.full_name?.toLowerCase().includes(displayName)) {
        return {
          mapped_user_id: appointment.patient_id,
          confidence: 'probable',
          matching_method: 'name',
        };
      }
      if (appointment.psychiatrist?.full_name?.toLowerCase().includes(displayName)) {
        return {
          mapped_user_id: appointment.psychiatrist_id,
          confidence: 'probable',
          matching_method: 'name',
        };
      }
    }

    return {
      mapped_user_id: null,
      confidence: 'unknown',
      matching_method: 'none',
    };
  },

  /**
   * Mark reconciliation as failed
   */
  async markReconciliationFailed(
    conferenceId: string,
    errorMessage: string,
    useServerClient: boolean = true
  ): Promise<void> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    await supabase
      .from('google_meet_conferences')
      .update({
        reconciliation_status: 'failed',
        reconciliation_error: errorMessage,
      })
      .eq('id', conferenceId);
  },

  /**
   * Extract space name from webhook event
   */
  extractSpaceNameFromEvent(event: GoogleMeetWebhookEvent): string | null {
    if (event.conferenceStarted?.space) {
      return event.conferenceStarted.space;
    }
    if (event.conferenceEnded?.space) {
      return event.conferenceEnded.space;
    }
    if (event.participantJoined?.space) {
      return event.participantJoined.space;
    }
    if (event.participantLeft?.space) {
      return event.participantLeft.space;
    }
    return null;
  },

  /**
   * Get attendance summary for an appointment
   */
  async getAttendanceSummary(
    appointmentId: string,
    useServerClient: boolean = true
  ): Promise<{
    patient_attended: boolean;
    psychiatrist_attended: boolean;
    patient_duration_minutes: number;
    psychiatrist_duration_minutes: number;
    billable_duration_minutes: number;
    total_events: number;
  }> {
    const supabase = useServerClient
      ? createClient()
      : createClient();

    const { data: sessions } = await supabase
      .from('participant_sessions')
      .select('*')
      .eq('appointment_id', appointmentId);

    let patientDuration = 0;
    let psychiatristDuration = 0;
    let patientAttended = false;
    let psychiatristAttended = false;

    for (const session of sessions || []) {
      const duration = session.duration_seconds ? Math.floor(session.duration_seconds / 60) : 0;
      
      if (session.participant_role === 'patient') {
        patientDuration += duration;
        patientAttended = true;
      } else if (session.participant_role === 'psychiatrist') {
        psychiatristDuration += duration;
        psychiatristAttended = true;
      }
    }

    const { data: events } = await supabase
      .from('attendance_events')
      .select('id')
      .eq('appointment_id', appointmentId);

    const billableCalc = await this.calculateBillableDuration(appointmentId);

    return {
      patient_attended: patientAttended,
      psychiatrist_attended: psychiatristAttended,
      patient_duration_minutes: patientDuration,
      psychiatrist_duration_minutes: psychiatristDuration,
      billable_duration_minutes: billableCalc.total_billable_minutes,
      total_events: events?.length || 0,
    };
  },
};
