/**
 * API Route: Session Status
 * GET /api/sessions/status?appointment_id={id}
 * 
 * Get current attendance status for an appointment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SessionStatusResponse, AttendanceStatus } from '@/types/session-tracking.types';
import { calculateOverlappingDuration } from '@/lib/session-duration-utils';

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

    // Verify user is a participant
    const { data: appointment } = await supabase
      .from('appointments')
      .select('id, listener_id, user_id')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.listener_id !== user.id && appointment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not a participant in this appointment' },
        { status: 403 }
      );
    }

    // Fetch all sessions for this appointment
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
    const listenerSessions = (allSessions || []).filter(
      s => s.participant_role === 'listener'
    );
    const userSessions = (allSessions || []).filter(
      s => s.participant_role === 'user'
    );

    // Check current status
    const listenerActive = listenerSessions.some(s => s.left_at === null);
    const userActive = userSessions.some(s => s.left_at === null);

    const listenerCheckedIn = listenerSessions.length > 0;
    const userCheckedIn = userSessions.length > 0;

    // Determine attendance status
    let status: AttendanceStatus;
    if (!listenerCheckedIn && !userCheckedIn) {
      status = 'not_started';
    } else if (listenerActive && userActive) {
      status = 'both_present';
    } else if (listenerActive) {
      status = 'listener_present';
    } else if (userActive) {
      status = 'user_present';
    } else {
      status = 'completed';
    }

    // Calculate overlapping duration (only for completed sessions)
    const completedListenerSessions = listenerSessions.filter(s => s.left_at !== null);
    const completedUserSessions = userSessions.filter(s => s.left_at !== null);
    
    const overlappingMinutes = calculateOverlappingDuration(
      completedListenerSessions,
      completedUserSessions
    );

    const response: SessionStatusResponse = {
      appointment_id: appointmentId,
      listener_checked_in: listenerCheckedIn,
      user_checked_in: userCheckedIn,
      listener_session: listenerActive ? listenerSessions.find(s => s.left_at === null) || null : null,
      user_session: userActive ? userSessions.find(s => s.left_at === null) || null : null,
      overlapping_duration_minutes: overlappingMinutes > 0 ? overlappingMinutes : null,
      status,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error fetching session status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session status' },
      { status: 500 }
    );
  }
}
