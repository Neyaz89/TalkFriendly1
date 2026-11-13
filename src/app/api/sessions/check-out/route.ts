/**
 * API Route: Session Check-Out
 * POST /api/sessions/check-out
 * 
 * Allows participants to manually check out of an appointment session
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CheckOutRequest, CheckOutResponse } from '@/types/session-tracking.types';
import { calculateTotalDuration } from '@/lib/session-duration-utils';

export async function POST(request: NextRequest) {
  try {
    const body: CheckOutRequest = await request.json();

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

    // Find active session for this user and appointment
    const { data: activeSessions, error: sessionError } = await supabase
      .from('participant_sessions')
      .select('*')
      .eq('appointment_id', body.appointment_id)
      .eq('user_id', user.id)
      .is('left_at', null);

    if (sessionError) {
      console.error('❌ Error fetching session:', sessionError);
      throw new Error(`Failed to fetch session: ${sessionError.message}`);
    }

    if (!activeSessions || activeSessions.length === 0) {
      return NextResponse.json(
        { error: 'No active session found. Please check in first.' },
        { status: 400 }
      );
    }

    const activeSession = activeSessions[0];

    // Update session with check-out time
    const now = new Date().toISOString();
    const joinedAt = new Date(activeSession.joined_at);
    const leftAt = new Date(now);
    const durationSeconds = Math.floor((leftAt.getTime() - joinedAt.getTime()) / 1000);

    const { data: updatedSession, error: updateError } = await supabase
      .from('participant_sessions')
      .update({
        left_at: now,
        duration_seconds: durationSeconds,
        updated_at: now,
      })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating session:', updateError);
      throw new Error(`Failed to check out: ${updateError.message}`);
    }

    const durationMinutes = Math.floor(durationSeconds / 60);

    // Check if both participants have checked out
    const { data: allSessions } = await supabase
      .from('participant_sessions')
      .select('*')
      .eq('appointment_id', body.appointment_id);

    const allCheckedOut = allSessions?.every(s => s.left_at !== null) || false;

    // If both have checked out, update appointment status
    if (allCheckedOut) {
      await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          actual_end_time: now,
        })
        .eq('id', body.appointment_id);
    }

    // Notify the other participant
    const { data: appointment } = await supabase
      .from('appointments')
      .select('listener_id, user_id')
      .eq('id', body.appointment_id)
      .single();

    if (appointment) {
      const participantRole = appointment.listener_id === user.id ? 'listener' : 'user';
      const otherParticipantId = participantRole === 'listener' 
        ? appointment.user_id 
        : appointment.listener_id;

      await supabase
        .from('notifications')
        .insert({
          user_id: otherParticipantId,
          type: 'session_ended',
          title: 'Participant Checked Out',
          message: `${participantRole === 'listener' ? 'Listener' : 'User'} has checked out of the session`,
          action_url: `/appointments/${body.appointment_id}`,
          metadata: {
            appointment_id: body.appointment_id,
            participant_role: participantRole,
            duration_minutes: durationMinutes,
          },
        });
    }

    console.log('✅ Check-out successful:', {
      appointmentId: body.appointment_id,
      userId: user.id,
      durationMinutes,
      time: now,
    });

    const response: CheckOutResponse = {
      success: true,
      session: updatedSession,
      duration_minutes: durationMinutes,
      message: `Successfully checked out. Session duration: ${durationMinutes} minutes`,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error checking out:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check out' },
      { status: 500 }
    );
  }
}
