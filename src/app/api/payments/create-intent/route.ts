/**
 * POST /api/payments/create-intent
 *
 * Creates a Stripe PaymentIntent for a one-off listener session booking.
 * Returns the client_secret to the browser so the Stripe Elements form can
 * collect card details client-side.
 *
 * Body:
 *   listenerId     – UUID of the listener
 *   duration       – session length in minutes (15 | 30 | 60)
 *   sessionType    – 'audio' | 'video'
 *   date           – YYYY-MM-DD
 *   startTime      – HH:MM
 *   bookingType    – 'now' | 'later'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, SESSION_PRICES_CENTS } from '@/lib/stripe';

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
    const { listenerId, duration, sessionType, date, startTime, bookingType } = body;

    if (!listenerId || !duration || !sessionType) {
      return NextResponse.json(
        { error: 'Missing required fields: listenerId, duration, sessionType' },
        { status: 400 }
      );
    }

    const durationKey = duration as 15 | 30 | 45 | 60;
    const amountCents = SESSION_PRICES_CENTS[durationKey];

    if (!amountCents) {
      return NextResponse.json(
        { error: `Unsupported duration: ${duration}. Must be 15, 30, 45, or 60.` },
        { status: 400 }
      );
    }

    // Fetch the listener to validate they exist and get their name
    const { data: listener, error: listenerError } = await supabase
      .from('listeners')
      .select('id, name, consultation_fee')
      .eq('id', listenerId)
      .eq('verification_status', 'verified')
      .single();

    if (listenerError || !listener) {
      return NextResponse.json(
        { error: 'Listener not found or not verified' },
        { status: 404 }
      );
    }

    // Fetch user profile for email (Stripe receipt)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Create or retrieve Stripe customer
    let stripeCustomerId: string | undefined;

    const { data: stripeRecord } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if ((stripeRecord as any)?.stripe_customer_id) {
      stripeCustomerId = (stripeRecord as any).stripe_customer_id;
    } else {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;

      // Store for future use (best-effort — column may not exist yet)
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId } as any)
        .eq('id', user.id);
    }

    // Create the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: stripeCustomerId,
      automatic_payment_methods: { enabled: true },
      description: `TalkFriendly – ${duration}-min ${sessionType} session with ${listener.name}`,
      metadata: {
        supabase_user_id: user.id,
        listener_id: listenerId,
        listener_name: listener.name,
        duration_minutes: String(duration),
        session_type: sessionType,
        date: date ?? '',
        start_time: startTime ?? '',
        booking_type: bookingType ?? 'later',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountCents,
      currency: 'usd',
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
