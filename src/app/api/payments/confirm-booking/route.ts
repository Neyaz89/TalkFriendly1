/**
 * POST /api/payments/confirm-booking
 *
 * Called after the browser has confirmed payment with Stripe.
 * Verifies the PaymentIntent succeeded, then creates the booking row in
 * Supabase and fires a notification to the listener.
 *
 * Body:
 *   paymentIntentId   – from Stripe after payment confirmation
 *   listenerId        – UUID
 *   duration          – 15 | 30 | 60
 *   sessionType       – 'audio' | 'video'
 *   date              – YYYY-MM-DD (empty string for "now" bookings)
 *   startTime         – HH:MM (empty string for "now" bookings)
 *   bookingType       – 'now' | 'later'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Auth guard
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      paymentIntentId,
      listenerId,
      duration,
      sessionType,
      date,
      startTime,
      bookingType,
    } = body;

    if (!paymentIntentId || !listenerId || !duration || !sessionType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the PaymentIntent actually succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        {
          error: `Payment not successful. Status: ${paymentIntent.status}`,
        },
        { status: 402 }
      );
    }

    // Verify it belongs to this user (security check via metadata)
    if (paymentIntent.metadata.supabase_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Payment intent does not belong to this user' },
        { status: 403 }
      );
    }

    // Idempotency: check if booking already exists for this PaymentIntent
    const { data: existing } = await supabase
      .from('listener_bookings')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        bookingId: existing.id,
        alreadyCreated: true,
      });
    }

    // Build session date
    const sessionDate =
      bookingType === 'now'
        ? new Date().toISOString()
        : date && startTime
        ? new Date(`${date}T${startTime}:00`).toISOString()
        : new Date().toISOString();

    // Generate a simple meet URL (replace with Google Meet API call if desired)
    const meetingUrl = `https://meet.google.com/talkfriendly-${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    // Create the booking record
    const { data: booking, error: bookingError } = await supabase
      .from('listener_bookings')
      .insert({
        user_id: user.id,
        listener_id: listenerId,
        session_date: sessionDate,
        session_duration: duration,
        status: 'confirmed',
        payment_intent_id: paymentIntentId,
        payment_status: 'paid',
        amount_cents: paymentIntent.amount,
        session_type: sessionType,
        meeting_url: meetingUrl,
        notes: null,
      } as any)
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking after payment:', bookingError);
      // Payment succeeded but booking failed — log for manual recovery
      return NextResponse.json(
        {
          error:
            'Payment succeeded but booking record could not be created. ' +
            'Please contact support with your payment reference: ' +
            paymentIntentId,
        },
        { status: 500 }
      );
    }

    // Send notification to listener
    await supabase.from('notifications').insert({
      user_id: listenerId,
      notification_type: 'booking',
      title: 'New Paid Session Booking',
      message: `You have a new confirmed session booking`,
      data: {
        booking_id: booking.id,
        payment_intent_id: paymentIntentId,
      },
      link: '/listener/bookings',
    } as any);

    // Increment session usage for free-tier tracking
    await supabase.rpc('increment_session_usage', { user_id_param: user.id });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      meetingUrl,
      sessionDate,
    });
  } catch (error: any) {
    console.error('Error confirming booking:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to confirm booking' },
      { status: 500 }
    );
  }
}
