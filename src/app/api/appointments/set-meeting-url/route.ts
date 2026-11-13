/**
 * API Route: Set Appointment Meeting URL
 * POST /api/appointments/set-meeting-url
 * 
 * Allows listeners and users to set custom meeting URLs for appointments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateMeetingUrl } from '@/lib/meeting-url-utils';

interface SetMeetingUrlPayload {
  appointment_id: string;
  meeting_url: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SetMeetingUrlPayload = await request.json();

    if (!body.appointment_id || !body.meeting_url) {
      return NextResponse.json(
        { error: 'appointment_id and meeting_url are required' },
        { status: 400 }
      );
    }

    // Validate and sanitize the meeting URL
    const validation = validateMeetingUrl(body.meeting_url);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid meeting URL' },
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

    // Fetch the appointment
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select('id, listener_id, user_id, status')
      .eq('id', body.appointment_id)
      .single();

    if (aptError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Verify user is a participant (listener or user)
    if (appointment.listener_id !== user.id && appointment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not a participant in this appointment' },
        { status: 403 }
      );
    }

    // Update appointment with sanitized URL and provider
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        google_meet_uri: validation.sanitizedUrl, // Using existing column
        google_meet_space_name: validation.provider, // Store provider type
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.appointment_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Error updating appointment:', updateError);
      throw new Error(`Failed to update meeting URL: ${updateError.message}`);
    }

    // Notify the other participant
    const otherParticipantId = appointment.listener_id === user.id 
      ? appointment.user_id 
      : appointment.listener_id;

    await supabase
      .from('notifications')
      .insert({
        user_id: otherParticipantId,
        type: 'meeting_link_updated',
        title: 'Meeting Link Updated',
        message: 'The meeting link for your upcoming session has been updated',
        action_url: `/appointments/${body.appointment_id}`,
        metadata: {
          appointment_id: body.appointment_id,
          provider: validation.provider,
        },
      });

    console.log('✅ Meeting URL updated:', {
      appointmentId: body.appointment_id,
      provider: validation.provider,
      updatedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      provider: validation.provider,
    });
  } catch (error: any) {
    console.error('❌ Error setting meeting URL:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set meeting URL' },
      { status: 500 }
    );
  }
}
