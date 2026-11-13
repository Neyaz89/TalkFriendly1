/**
 * API Route: Send Booking Form as Chat Message
 * POST /api/messages/send-booking-form
 * 
 * Creates a booking form and sends it as a special message type in chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversation_id,
      title,
      description,
      available_slots,
      duration_pricing,
      support_areas,
    } = body;

    // Validate required fields
    if (!conversation_id) {
      return NextResponse.json(
        { error: 'conversation_id is required' },
        { status: 400 }
      );
    }

    if (!title || !available_slots || !duration_pricing) {
      return NextResponse.json(
        { error: 'title, available_slots, and duration_pricing are required' },
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

    // Verify user is a listener
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.account_type !== 'listener') {
      return NextResponse.json(
        { error: 'Only listeners can send booking forms' },
        { status: 403 }
      );
    }

    // Verify conversation exists and user is a participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('participant_1_id, participant_2_id')
      .eq('id', conversation_id)
      .single();

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    if (
      conversation.participant_1_id !== user.id &&
      conversation.participant_2_id !== user.id
    ) {
      return NextResponse.json(
        { error: 'Unauthorized: Not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Get the other participant (recipient)
    const recipientId =
      conversation.participant_1_id === user.id
        ? conversation.participant_2_id
        : conversation.participant_1_id;

    // Convert pricing to cents for storage
    const pricingInCents: Record<string, number> = {};
    Object.entries(duration_pricing).forEach(([duration, price]) => {
      pricingInCents[duration] = Math.round((price as number) * 100);
    });

    // Create the booking form in database
    const { data: bookingForm, error: formError } = await supabase
      .from('session_booking_forms')
      .insert({
        listener_id: user.id,
        title,
        description: description || null,
        available_slots: available_slots,
        duration_pricing: pricingInCents,
        support_areas: support_areas || [
          'Anxiety',
          'Depression',
          'Stress Management',
          'Relationships',
          'Career Counseling',
          'Other',
        ],
        is_active: true,
      })
      .select()
      .single();

    if (formError) {
      console.error('❌ Error creating booking form:', formError);
      throw new Error(`Failed to create booking form: ${formError.message}`);
    }

    // Create the message content (JSONB payload)
    const messageContent = {
      booking_form_id: bookingForm.id,
      title: bookingForm.title,
      description: bookingForm.description,
      available_slots: bookingForm.available_slots,
      duration_pricing: bookingForm.duration_pricing,
      support_areas: bookingForm.support_areas,
    };

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversation_id,
        sender_id: user.id,
        content: JSON.stringify(messageContent),
        message_type: 'session_booking_form',
      })
      .select(
        `
        *,
        sender:profiles!messages_sender_id_fkey(id, username, full_name, avatar_url, account_type, is_verified)
      `
      )
      .single();

    if (messageError) {
      console.error('❌ Error creating message:', messageError);
      throw new Error(`Failed to create message: ${messageError.message}`);
    }

    // Send notification to recipient
    await supabase.from('notifications').insert({
      user_id: recipientId,
      notification_type: 'message',
      title: 'Session Booking Form',
      message: `${profile.account_type === 'listener' ? 'Your listener' : 'Someone'} sent you a booking form`,
      data: {
        conversation_id: conversation_id,
        message_id: message.id,
        booking_form_id: bookingForm.id,
      },
      link: `/messages?conversation=${conversation_id}`,
    });

    return NextResponse.json({
      success: true,
      message: message,
      booking_form: bookingForm,
    });
  } catch (error: any) {
    console.error('❌ Error sending booking form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send booking form' },
      { status: 500 }
    );
  }
}
