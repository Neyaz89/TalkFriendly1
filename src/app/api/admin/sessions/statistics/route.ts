/**
 * API Route: Admin - Session Statistics
 * GET /api/admin/sessions/statistics
 * 
 * Get aggregated session statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SessionStatistics } from '@/types/session-tracking.types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listenerId = searchParams.get('listener_id');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

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

    // Build query
    let appointmentsQuery = supabase
      .from('appointments')
      .select('id, listener_id, scheduled_time, status, created_at');

    if (listenerId) {
      appointmentsQuery = appointmentsQuery.eq('listener_id', listenerId);
    }

    if (fromDate) {
      appointmentsQuery = appointmentsQuery.gte('scheduled_time', fromDate);
    }

    if (toDate) {
      appointmentsQuery = appointmentsQuery.lte('scheduled_time', toDate);
    }

    const { data: appointments, error: appointmentsError } = await appointmentsQuery;

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
      throw new Error(`Failed to fetch appointments: ${appointmentsError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      const emptyStats: SessionStatistics = {
        total_sessions: 0,
        total_duration_hours: 0,
        average_duration_minutes: 0,
        completed_sessions: 0,
        incomplete_sessions: 0,
        sessions_by_status: {
          not_started: 0,
          listener_present: 0,
          user_present: 0,
          both_present: 0,
          completed: 0,
        },
        sessions_by_month: [],
      };
      return NextResponse.json(emptyStats);
    }

    // Fetch all sessions
    const appointmentIds = appointments.map(a => a.id);
    const { data: allSessions, error: sessionsError } = await supabase
      .from('participant_sessions')
      .select('*')
      .in('appointment_id', appointmentIds);

    if (sessionsError) {
      console.error('❌ Error fetching sessions:', sessionsError);
      throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
    }

    // Calculate statistics
    let totalDurationMinutes = 0;
    let completedCount = 0;
    let incompleteCount = 0;
    const statusCounts: Record<string, number> = {
      not_started: 0,
      listener_present: 0,
      user_present: 0,
      both_present: 0,
      completed: 0,
    };
    const monthlyData: Map<string, { count: number; totalHours: number }> = new Map();

    for (const appointment of appointments) {
      const sessions = (allSessions || []).filter(s => s.appointment_id === appointment.id);
      
      if (sessions.length === 0) {
        statusCounts.not_started++;
        incompleteCount++;
        continue;
      }

      const listenerSessions = sessions.filter(s => s.participant_role === 'listener');
      const userSessions = sessions.filter(s => s.participant_role === 'user');

      // Calculate duration
      let appointmentDuration = 0;
      for (const session of sessions) {
        if (session.duration_seconds) {
          appointmentDuration += Math.floor(session.duration_seconds / 60);
        }
      }

      totalDurationMinutes += appointmentDuration;

      // Determine status
      const listenerActive = listenerSessions.some(s => s.left_at === null);
      const userActive = userSessions.some(s => s.left_at === null);
      const listenerPresent = listenerSessions.length > 0;
      const userPresent = userSessions.length > 0;

      if (!listenerPresent && !userPresent) {
        statusCounts.not_started++;
        incompleteCount++;
      } else if (listenerActive && userActive) {
        statusCounts.both_present++;
        incompleteCount++;
      } else if (listenerActive) {
        statusCounts.listener_present++;
        incompleteCount++;
      } else if (userActive) {
        statusCounts.user_present++;
        incompleteCount++;
      } else {
        statusCounts.completed++;
        completedCount++;
      }

      // Monthly data
      const monthKey = new Date(appointment.scheduled_time).toISOString().substring(0, 7); // YYYY-MM
      const existing = monthlyData.get(monthKey) || { count: 0, totalHours: 0 };
      monthlyData.set(monthKey, {
        count: existing.count + 1,
        totalHours: existing.totalHours + (appointmentDuration / 60),
      });
    }

    // Build monthly array
    const sessionsByMonth = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        total_hours: Math.round(data.totalHours * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const statistics: SessionStatistics = {
      total_sessions: appointments.length,
      total_duration_hours: Math.round((totalDurationMinutes / 60) * 100) / 100,
      average_duration_minutes: appointments.length > 0 
        ? Math.round(totalDurationMinutes / appointments.length) 
        : 0,
      completed_sessions: completedCount,
      incomplete_sessions: incompleteCount,
      sessions_by_status: statusCounts as any,
      sessions_by_month: sessionsByMonth,
    };

    return NextResponse.json(statistics);
  } catch (error: any) {
    console.error('❌ Error calculating statistics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to calculate statistics' },
      { status: 500 }
    );
  }
}
