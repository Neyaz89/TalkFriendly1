/**
 * POST /api/payments/webhook
 *
 * Stripe webhook endpoint.
 * Handles post-payment events so the DB stays in sync even if the browser
 * closes before confirm-booking is called.
 *
 * Required Stripe events to enable in dashboard:
 *   - payment_intent.succeeded
 *   - payment_intent.payment_failed
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 *
 * Set STRIPE_WEBHOOK_SECRET in .env.local to the secret from your
 * Stripe dashboard (Webhooks → your endpoint → Signing secret).
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const sig = headersList.get('stripe-signature');

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig ?? '', webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    switch (event.type) {
      // ── One-off session payment succeeded ──────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const userId = pi.metadata.supabase_user_id;
        const listenerId = pi.metadata.listener_id;

        if (!userId || !listenerId) break; // Not a session booking intent

        // Check if booking already exists (confirm-booking API may have already run)
        const { data: existing } = await supabase
          .from('listener_bookings')
          .select('id')
          .eq('payment_intent_id', pi.id)
          .maybeSingle();

        if (existing) break; // Already handled

        const bookingType = pi.metadata.booking_type ?? 'later';
        const date = pi.metadata.date;
        const startTime = pi.metadata.start_time;
        const duration = parseInt(pi.metadata.duration_minutes ?? '60', 10);
        const sessionType = pi.metadata.session_type ?? 'video';

        const sessionDate =
          bookingType === 'now'
            ? new Date().toISOString()
            : date && startTime
            ? new Date(`${date}T${startTime}:00`).toISOString()
            : new Date().toISOString();

        const meetingUrl = `https://meet.google.com/talkfriendly-${Math.random()
          .toString(36)
          .slice(2, 9)}`;

        await supabase.from('listener_bookings').insert({
          user_id: userId,
          listener_id: listenerId,
          session_date: sessionDate,
          session_duration: duration,
          status: 'confirmed',
          payment_intent_id: pi.id,
          payment_status: 'paid',
          amount_cents: pi.amount,
          session_type: sessionType,
          meeting_url: meetingUrl,
        } as any);

        // Notify the listener
        await supabase.from('notifications').insert({
          user_id: listenerId,
          notification_type: 'message',
          title: 'New Paid Session Booking',
          message: `You have a new confirmed session booking`,
          data: { payment_intent_id: pi.id },
          link: '/listener/bookings',
        } as any);

        break;
      }

      // ── One-off session payment failed ─────────────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.warn('Payment failed for intent:', pi.id);
        // No booking to roll back — it was never created
        break;
      }

      // ── Subscription created / updated ──────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, sub);
        break;
      }

      // ── Subscription cancelled ──────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        // Downgrade to free
        const userId = sub.metadata.supabase_user_id;
        if (userId) {
          await supabase
            .from('profiles')
            .update({ subscription_tier: 'free' } as any)
            .eq('id', userId);
        }
        break;
      }

      // ── Subscription invoice paid ───────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // In Stripe API v2026+, subscription reference is in invoice.parent
        const subscriptionId =
          (invoice as any).subscription ??
          ((invoice as any).parent?.type === 'subscription_details'
            ? (invoice as any).parent?.subscription_details?.subscription
            : null);
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId as string);
          await handleSubscriptionChange(supabase, sub);
        }
        break;
      }

      default:
        // Unhandled event type — not an error
        break;
    }
  } catch (err: any) {
    console.error('Error processing webhook event:', err);
    // Return 200 so Stripe doesn't retry endlessly for non-critical errors
  }

  return NextResponse.json({ received: true });
}

// ── Helper: map Stripe subscription to Supabase tier ──────────────────────────

async function handleSubscriptionChange(supabase: any, sub: Stripe.Subscription) {
  const userId = sub.metadata.supabase_user_id;
  if (!userId) return;

  const priceId = sub.items.data[0]?.price.id ?? '';
  const tier = resolveTierFromPriceId(priceId);

  if (!tier) return;

  await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      stripe_subscription_id: sub.id,
    } as any)
    .eq('id', userId);
}

function resolveTierFromPriceId(priceId: string): 'free' | 'plus' | 'premium' | null {
  const { STRIPE_PRICE_PLUS_MONTHLY, STRIPE_PRICE_PLUS_ANNUAL,
          STRIPE_PRICE_PREMIUM_MONTHLY, STRIPE_PRICE_PREMIUM_ANNUAL } = process.env;

  if (priceId === STRIPE_PRICE_PLUS_MONTHLY || priceId === STRIPE_PRICE_PLUS_ANNUAL) {
    return 'plus';
  }
  if (priceId === STRIPE_PRICE_PREMIUM_MONTHLY || priceId === STRIPE_PRICE_PREMIUM_ANNUAL) {
    return 'premium';
  }
  return null;
}
