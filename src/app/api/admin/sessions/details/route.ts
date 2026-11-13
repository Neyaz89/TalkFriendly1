/**
 * API Route: Admin - Session Details
 * GET /api/admin/sessions/details?appointment_id={id}
 * 
 * Get detailed session information for admin review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SessionReviewData } from '@/types/session-tracking.types';
import { calculateSessionDuration, checkSessionAnomalies } from '@/lib/session-duration-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointment_id');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'appointment_id is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.account_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Fetch all sessions
    const { data: allSessions, error: sessionsError } = await supabase
      .from('participant_sessions')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('joined_at', { ascending: true });

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    // Separate by role
    const listenerSessions = (allSessions || []).filter(s => s.participant_role === 'listener');
    const userSessions = (allSessions || []).filter(s => s.participant_role === 'user');

    // Fetch profiles
    const { data: listenerProfile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', appointment.listener_id)
      .single();

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', appointment.user_id)
      .single();

    // Calculate duration
    const duration = calculateSessionDuration(listenerSessions, userSessions);

    // Check for anomalies
    const allSessionAnomalies = [...listenerSessions, ...userSessions].map(session => {
      const check = checkSessionAnomalies(session);
      return {
        session_id: session.id,
        participant: session.participant_role,
        ...check,
      };
    });

    const hasAnomalies = allSessionAnomalies.some(a => a.hasSuspiciousActivity);
    const allWarnings = allSessionAnomalies.flatMap(a => a.warnings);

    // Check if requires review
    const requiresReview = 
      hasAnomalies ||
      (listenerSessions.length > 0 && userSessions.length === 0) || // Only listener
      (userSessions.length > 0 && listenerSessions.length === 0) ||  // Only user
      duration.overlapping_minutes === 0;                             // No overlap

    // Fetch existing review notes (if any)
    const { data: reviewNotes } = await supabase
      .from('session_reviews')
      .select('notes')
      .eq('appointment_id', appointmentId)
      .single();

    const reviewData: SessionReviewData = {
      appointment_id: appointmentId,
      scheduled_time: appointment.scheduled_time,
      listener_id: appointment.listener_id,
      listener_name: listenerProfile?.name || 'Unknown',
      user_id: appointment.user_id,
      user_name: userProfile?.name || 'Unknown',
      listener_sessions: listenerSessions,
      user_sessions: userSessions,
      total_duration_minutes: Math.max(duration.listener_total_minutes, duration.user_total_minutes),
      overlapping_duration_minutes: duration.overlapping_minutes,
      requires_review: requiresReview,
      review_notes: reviewNotes?.notes || null,
    };

    return NextResponse.json({
      ...reviewData,
      anomalies: allSessionAnomalies.filter(a => a.hasSuspiciousActivity),
      warnings: allWarnings,
      appointment_details: {
        status: appointment.status,
        meeting_url: appointment.google_meet_uri,
        actual_start_time: appointment.actual_start_time,
        actual_end_time: appointment.actual_end_time,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching session details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session details' },
      { status: 500 }
    );
  }
}
