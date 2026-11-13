/**
 * API Route: Listener Session History
 * GET /api/sessions/listener-history?listener_id={id}
 * 
 * Get session history and statistics for a listener
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ListenerSessionHistory, SessionHistoryItem } from '@/types/session-tracking.types';
import { calculateOverlappingDuration, calculateTotalDuration } from '@/lib/session-duration-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listenerId = searchParams.get('listener_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!listenerId) {
      return NextResponse.json(
        { error: 'listener_id is required' },
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

    // Get listener profile
    const { data: listenerProfile } = await supabase
      .from('profiles')
      .select('id, name, account_type')
      .eq('id', listenerId)
      .single();

    if (!listenerProfile) {
      return NextResponse.json(
        { error: 'Listener not found' },
        { status: 404 }
      );
    }

    // Only listener themselves or admin can view history
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (user.id !== listenerId && adminProfile?.account_type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to view this listener\'s history' },
        { status: 403 }
      );
    }

    // Fetch appointments for this listener
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, user_id, scheduled_time, status')
      .eq('listener_id', listenerId)
      .order('scheduled_time', { ascending: false })
      .limit(limit);

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
      throw new Error(`Failed to fetch appointments: ${appointmentsError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      const emptyResponse: ListenerSessionHistory = {
        listener_id: listenerId,
        listener_name: listenerProfile.name || 'Unknown',
        total_sessions: 0,
        total_hours: 0,
        completed_sessions: 0,
        average_session_duration_minutes: 0,
        recent_sessions: [],
      };
      return NextResponse.json(emptyResponse);
    }

    // Fetch all sessions for these appointments
    const appointmentIds = appointments.map(a => a.id);
    const { data: allSessions, error: sessionsError } = await supabase
      .from('participant_sessions')
      .select('*')
      .in('appointment_id', appointmentIds);

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    // Fetch user profiles
    const userIds = appointments.map(a => a.user_id);
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    const userProfileMap = new Map(userProfiles?.map(p => [p.id, p.name]) || []);

    // Calculate statistics
    let totalMinutes = 0;
    let completedCount = 0;
    const recentSessions: SessionHistoryItem[] = [];

    for (const appointment of appointments) {
      const listenerSessions = (allSessions || []).filter(
        s => s.appointment_id === appointment.id && s.participant_role === 'listener'
      );
      const userSessions = (allSessions || []).filter(
        s => s.appointment_id === appointment.id && s.participant_role === 'user'
      );

      const listenerDuration = calculateTotalDuration(listenerSessions);
      const overlappingDuration = calculateOverlappingDuration(listenerSessions, userSessions);

      totalMinutes += listenerDuration;

      if (listenerSessions.length > 0 && listenerSessions.every(s => s.left_at !== null)) {
        completedCount++;
      }

      // Build session history item
      if (listenerSessions.length > 0) {
        const firstSession = listenerSessions[0];
        recentSessions.push({
          appointment_id: appointment.id,
          user_id: appointment.user_id,
          user_name: userProfileMap.get(appointment.user_id) || 'Unknown',
          scheduled_time: appointment.scheduled_time,
          joined_at: firstSession.joined_at,
          left_at: firstSession.left_at,
          duration_minutes: listenerDuration > 0 ? listenerDuration : null,
          overlapping_duration_minutes: overlappingDuration > 0 ? overlappingDuration : null,
          status: appointment.status,
        });
      }
    }

    const totalHours = totalMinutes / 60;
    const avgDuration = appointments.length > 0 ? totalMinutes / appointments.length : 0;

    const response: ListenerSessionHistory = {
      listener_id: listenerId,
      listener_name: listenerProfile.name || 'Unknown',
      total_sessions: appointments.length,
      total_hours: Math.round(totalHours * 100) / 100,
      completed_sessions: completedCount,
      average_session_duration_minutes: Math.round(avgDuration),
      recent_sessions: recentSessions,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error fetching listener history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch listener history' },
      { status: 500 }
    );
  }
}
