/**
 * API Route: Create Session Booking
 * POST /api/bookings/create
 * 
 * Creates a booking when user submits the booking form
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      booking_form_id,
      selected_slot,
      selected_duration,
      support_area,
      support_details,
    } = body;

    // Validate required fields
    if (!booking_form_id || !selected_slot || !selected_duration || !support_area || !support_details) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate duration
    if (![15, 30, 45, 60].includes(selected_duration)) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be 15, 30, 45, or 60 minutes' },
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

    // Fetch the booking form
    const { data: bookingForm, error: formError } = await supabase
      .from('session_booking_forms')
      .select('*')
      .eq('id', booking_form_id)
      .eq('is_active', true)
      .single();

    if (formError || !bookingForm) {
      return NextResponse.json(
        { error: 'Booking form not found or inactive' },
        { status: 404 }
      );
    }

    // Get the price for the selected duration
    const priceInCents = bookingForm.duration_pricing[selected_duration.toString()];

    if (!priceInCents || priceInCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid duration or pricing not available for this duration' },
        { status: 400 }
      );
    }

    // Find the conversation between user and listener
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1_id.eq.${user.id},participant_2_id.eq.${bookingForm.listener_id}),and(participant_1_id.eq.${bookingForm.listener_id},participant_2_id.eq.${user.id})`)
      .limit(1);

    const conversationId = conversations?.[0]?.id || null;

    // Find the message that contains this booking form
    let messageId = null;
    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('message_type', 'session_booking_form')
        .order('created_at', { ascending: false })
        .limit(10);

      // Find the message with this booking_form_id in content
      const message = messages?.find(m => {
        try {
          const content = JSON.parse((m as any).content || '{}');
          return content.booking_form_id === booking_form_id;
        } catch {
          return false;
        }
      });
      messageId = message?.id || null;
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('session_bookings')
      .insert({
        booking_form_id: booking_form_id,
        listener_id: bookingForm.listener_id,
        user_id: user.id,
        conversation_id: conversationId,
        message_id: messageId,
        selected_slot: selected_slot,
        selected_duration: selected_duration,
        price_amount: priceInCents,
        support_area: support_area,
        support_details: support_details,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Error creating booking:', bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    // Update the message content to include booking_id
    if (messageId) {
      const { data: currentMessage } = await supabase
        .from('messages')
        .select('content')
        .eq('id', messageId)
        .single();

      if (currentMessage) {
        try {
          const content = JSON.parse(currentMessage.content || '{}');
          content.booking_id = booking.id;

          await supabase
            .from('messages')
            .update({ content: JSON.stringify(content) })
            .eq('id', messageId);
        } catch (error) {
          console.error('Error updating message with booking_id:', error);
        }
      }
    }

    // Send notification to listener
    await supabase.from('notifications').insert({
      user_id: bookingForm.listener_id,
      notification_type: 'message',
      title: 'New Session Booking',
      message: `You have a new session booking request`,
      data: {
        booking_id: booking.id,
        conversation_id: conversationId,
      },
      link: conversationId ? `/messages?conversation=${conversationId}` : '/listener/bookings',
    });

    // Send confirmation message in chat
    if (conversationId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `Booking request submitted! 📅\n\nSession: ${selected_duration} minutes\nSupport area: ${support_area}\n\nWaiting for confirmation...`,
        message_type: 'system',
      });
    }

    return NextResponse.json({
      success: true,
      booking: booking,
      message: 'Booking created successfully. The listener will confirm your session shortly.',
    });
  } catch (error: any) {
    console.error('❌ Error creating booking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create booking' },
      { status: 500 }
    );
  }
}
