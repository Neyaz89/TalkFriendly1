/**
 * API Route: Session Check-In
 * POST /api/sessions/check-in
 * 
 * Allows participants to manually check in to an appointment session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CheckInRequest, CheckInResponse, ParticipantRole } from '@/types/session-tracking.types';

export async function POST(request: NextRequest) {
  try {
    const body: CheckInRequest = await request.json();

    if (!body.appointment_id) {
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

    // Fetch appointment with participant info
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('id, listener_id, user_id, scheduled_time, status')
      .eq('id', body.appointment_id)
      .single();

    if (aptError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Determine participant role
    let participantRole: ParticipantRole;
    if (appointment.listener_id === user.id) {
      participantRole = 'listener';
    } else if (appointment.user_id === user.id) {
      participantRole = 'user';
    } else {
      return NextResponse.json(
        { error: 'You are not a participant in this appointment' },
        { status: 403 }
      );
    }

    // Check if already checked in (active session exists)
    const { data: existingSessions } = await supabase
      .from('participant_sessions')
      .select('*')
      .eq('appointment_id', body.appointment_id)
      .eq('user_id', user.id)
      .is('left_at', null);

    if (existingSessions && existingSessions.length > 0) {
      return NextResponse.json(
        { error: 'You are already checked in to this session' },
        { status: 400 }
      );
    }

    // Create check-in session
    const now = new Date().toISOString();
    const { data: session, error: sessionError } = await supabase
      .from('participant_sessions')
      .insert({
        appointment_id: body.appointment_id,
        user_id: user.id,
        participant_role: participantRole,
        joined_at: now,
        source: 'manual_check_in',
      })
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creating session:', sessionError);
      throw new Error(`Failed to check in: ${sessionError.message}`);
    }

    // Update appointment status if needed
    if (appointment.status === 'scheduled' || appointment.status === 'ready') {
      await supabase
        .from('appointments')
        .update({ 
          status: 'in_progress',
          actual_start_time: now,
        })
        .eq('id', body.appointment_id);
    }

    // Notify the other participant
    const otherParticipantId = participantRole === 'listener' 
      ? appointment.user_id 
      : appointment.listener_id;

    await supabase
      .from('notifications')
      .insert({
        user_id: otherParticipantId,
        type: 'session_started',
        title: 'Session Started',
        message: `${participantRole === 'listener' ? 'Listener' : 'User'} has checked in to your session`,
        action_url: `/appointments/${body.appointment_id}`,
        metadata: {
          appointment_id: body.appointment_id,
          participant_role: participantRole,
        },
      });

    console.log('✅ Check-in successful:', {
      appointmentId: body.appointment_id,
      userId: user.id,
      role: participantRole,
      time: now,
    });

    const response: CheckInResponse = {
      success: true,
      session,
      message: 'Successfully checked in to session',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error checking in:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check in' },
      { status: 500 }
    );
  }
}
