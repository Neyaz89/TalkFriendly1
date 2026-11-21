/**
 * POST /api/subscriptions/create-checkout
 *
 * Creates a Stripe Checkout Session for Plus or Premium subscriptions.
 * Redirects the user to hosted Stripe Checkout to collect card details.
 *
 * Body:
 *   plan    – 'plus' | 'premium'
 *   billing – 'monthly' | 'annual'
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, STRIPE_PRICES } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, billing = 'monthly' } = body;

    if (!plan || !['plus', 'premium'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "plus" or "premium".' },
        { status: 400 }
      );
    }

    const priceKey = `${plan}_${billing}` as keyof typeof STRIPE_PRICES;
    const priceId = STRIPE_PRICES[priceKey];

    if (!priceId) {
      return NextResponse.json(
        {
          error: `Stripe price ID for ${plan}/${billing} is not configured. ` +
                 'Set STRIPE_PRICE_* environment variables.',
        },
        { status: 503 }
      );
    }

    // Fetch profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: (profile as any)?.stripe_customer_id
        ? undefined
        : (profile?.email ?? user.email),
      customer: (profile as any)?.stripe_customer_id ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings?subscription=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        plan,
        billing,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message ?? 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
