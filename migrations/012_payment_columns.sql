-- ============================================================================
-- Migration 012: Payment columns for Stripe integration
-- Apply this in your Supabase SQL editor before using the payment system.
-- ============================================================================

-- Add Stripe customer + subscription tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add payment columns to listener_bookings
ALTER TABLE public.listener_bookings
  ADD COLUMN IF NOT EXISTS payment_intent_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  ADD COLUMN IF NOT EXISTS amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'video'
    CHECK (session_type IN ('audio', 'video')),
  ADD COLUMN IF NOT EXISTS meeting_url TEXT;

-- Index for payment intent lookups (idempotency checks)
CREATE INDEX IF NOT EXISTS idx_listener_bookings_payment_intent
  ON public.listener_bookings(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL;

-- Index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 012 applied: Stripe payment columns added.';
END $$;
