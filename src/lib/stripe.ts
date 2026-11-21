/**
 * Stripe helpers — server-side SDK instance and shared config.
 */

import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// ── Server-side Stripe client ────────────────────────────────────────────────

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn(
    '⚠️  STRIPE_SECRET_KEY is not set. Payment features will not work. ' +
    'Add it to your .env.local file.'
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
  apiVersion: '2026-10-28.endive',
  typescript: true,
});

// ── Client-side Stripe promise (singleton) ───────────────────────────────────

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ''
    );
  }
  return stripePromise;
}

// ── Stripe Price IDs for subscriptions ───────────────────────────────────────
// Set these in your .env.local after creating products in the Stripe dashboard.

export const STRIPE_PRICES = {
  plus_monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY ?? '',
  plus_annual: process.env.STRIPE_PRICE_PLUS_ANNUAL ?? '',
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? '',
  premium_annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL ?? '',
} as const;

// ── Session pricing (must match constants/index.ts SESSION_DURATIONS) ────────
// Values are in cents (USD).

export const SESSION_PRICES_CENTS: Record<15 | 30 | 45 | 60, number> = {
  15: parseInt(process.env.SESSION_PRICE_15_MIN ?? '1500', 10),
  30: parseInt(process.env.SESSION_PRICE_30_MIN ?? '3000', 10),
  45: parseInt(process.env.SESSION_PRICE_45_MIN ?? '4500', 10),
  60: parseInt(process.env.SESSION_PRICE_60_MIN ?? '6000', 10),
};
