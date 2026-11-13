/**
 * API Route: Admin - List All Sessions
 * GET /api/admin/sessions/list
 * 
 * Admin-only endpoint to list and filter sessions across all listeners
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { calculateOverlappingDuration, calculateTotalDuration } from '@/lib/session-duration-utils';

interface SessionListItem {
  appointment_id: string;
  listener_id: string;
  listener_name: string;
  user_id: string;
  user_name: string;
  scheduled_time: string;
  appointment_status: string;
  listener_checked_in: boolean;
  user_checked_in: boolean;
  listener_duration_minutes: number | null;
  user_duration_minutes: number | null;
  overlapping_duration_minutes: number | null;
  has_anomalies: boolean;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const listenerId = searchParams.get('listener_id');
    const status = searchParams.get('status');
    const anomaliesOnly = searchParams.get('anomalies_only') === 'true';
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

    // Build query for appointments
    let appointmentsQuery = supabase
      .from('appointments')
      .select('id, listener_id, user_id, scheduled_time, status, created_at')
      .order('scheduled_time', { ascending: false });

    // Apply filters
    if (listenerId) {
      appointmentsQuery = appointmentsQuery.eq('listener_id', listenerId);
    }

    if (status) {
      appointmentsQuery = appointmentsQuery.eq('status', status);
    }

    if (fromDate) {
      appointmentsQuery = appointmentsQuery.gte('scheduled_time', fromDate);
    }

    if (toDate) {
      appointmentsQuery = appointmentsQuery.lte('scheduled_time', toDate);
    }

    // Pagination
    const offset = (page - 1) * limit;
    appointmentsQuery = appointmentsQuery.range(offset, offset + limit - 1);

    const { data: appointments, error: appointmentsError } = await appointmentsQuery;

    if (appointmentsError) {
      console.error('❌ Error fetching appointments:', appointmentsError);
      throw new Error(`Failed to fetch appointments: ${appointmentsError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        sessions: [],
        total: 0,
        page,
        limit,
      });
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
    const userIds = [...new Set([
      ...appointments.map(a => a.listener_id),
      ...appointments.map(a => a.user_id),
    ])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);

    // Build session list
    const sessionList: SessionListItem[] = [];

    for (const appointment of appointments) {
      const listenerSessions = (allSessions || []).filter(
        s => s.appointment_id === appointment.id && s.participant_role === 'listener'
      );
      const userSessions = (allSessions || []).filter(
        s => s.appointment_id === appointment.id && s.participant_role === 'user'
      );

      const listenerDuration = calculateTotalDuration(listenerSessions);
      const userDuration = calculateTotalDuration(userSessions);
      const overlappingDuration = calculateOverlappingDuration(listenerSessions, userSessions);

      // Check for anomalies
      const hasAnomalies = 
        listenerDuration > 0 && listenerDuration < 5 ||  // Too short
        listenerDuration > 240 ||                          // Too long
        userDuration > 0 && userDuration < 5 ||
        userDuration > 240 ||
        (listenerSessions.length > 0 && userSessions.length === 0) || // Only one participant
        (userSessions.length > 0 && listenerSessions.length === 0);

      // Skip if filtering for anomalies only
      if (anomaliesOnly && !hasAnomalies) {
        continue;
      }

      sessionList.push({
        appointment_id: appointment.id,
        listener_id: appointment.listener_id,
        listener_name: profileMap.get(appointment.listener_id) || 'Unknown',
        user_id: appointment.user_id,
        user_name: profileMap.get(appointment.user_id) || 'Unknown',
        scheduled_time: appointment.scheduled_time,
        appointment_status: appointment.status,
        listener_checked_in: listenerSessions.length > 0,
        user_checked_in: userSessions.length > 0,
        listener_duration_minutes: listenerDuration > 0 ? listenerDuration : null,
        user_duration_minutes: userDuration > 0 ? userDuration : null,
        overlapping_duration_minutes: overlappingDuration > 0 ? overlappingDuration : null,
        has_anomalies: hasAnomalies,
        created_at: appointment.created_at,
      });
    }

    // Get total count
    let countQuery = supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true });

    if (listenerId) {
      countQuery = countQuery.eq('listener_id', listenerId);
    }
    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (fromDate) {
      countQuery = countQuery.gte('scheduled_time', fromDate);
    }
    if (toDate) {
      countQuery = countQuery.lte('scheduled_time', toDate);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      sessions: sessionList,
      total: count || 0,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('❌ Error listing sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list sessions' },
      { status: 500 }
    );
  }
}
