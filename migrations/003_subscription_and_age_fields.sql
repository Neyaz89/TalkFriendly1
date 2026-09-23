-- ============================================
-- TalkFriendly - Subscription & Age Confirmation Migration
-- ============================================
-- 
-- This migration adds:
-- 1. Subscription tier tracking
-- 2. Listener session limits and usage tracking
-- 3. Age confirmation fields
-- 4. Account deletion tracking
--
-- ============================================

-- Add subscription and session tracking fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'plus', 'premium')),
ADD COLUMN IF NOT EXISTS listener_sessions_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS listener_sessions_reset_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS age_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for subscription tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier 
ON public.profiles(subscription_tier);

-- Create index for session reset queries
CREATE INDEX IF NOT EXISTS idx_profiles_session_reset 
ON public.profiles(listener_sessions_reset_date) 
WHERE subscription_tier = 'free';

-- Create listener_bookings table to track actual session bookings
CREATE TABLE IF NOT EXISTS public.listener_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listener_id UUID NOT NULL,
  session_date TIMESTAMPTZ NOT NULL,
  session_duration INTEGER NOT NULL, -- in minutes
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for bookings
CREATE INDEX IF NOT EXISTS idx_listener_bookings_user 
ON public.listener_bookings(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listener_bookings_listener 
ON public.listener_bookings(listener_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_listener_bookings_status 
ON public.listener_bookings(status);

-- Enable RLS on listener_bookings
ALTER TABLE public.listener_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listener_bookings
DROP POLICY IF EXISTS "Users can view own bookings" ON public.listener_bookings;
CREATE POLICY "Users can view own bookings" 
ON public.listener_bookings FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bookings" ON public.listener_bookings;
CREATE POLICY "Users can insert own bookings" 
ON public.listener_bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.listener_bookings;
CREATE POLICY "Users can update own bookings" 
ON public.listener_bookings FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to reset monthly session limits (to be called via cron or scheduled job)
CREATE OR REPLACE FUNCTION reset_monthly_session_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    listener_sessions_used = 0,
    listener_sessions_reset_date = NOW()
  WHERE 
    subscription_tier = 'free'
    AND listener_sessions_reset_date < NOW() - INTERVAL '1 month';
END;
$$;

-- Function to check if user can book a session (server-side enforcement)
CREATE OR REPLACE FUNCTION can_book_listener_session(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_tier TEXT;
  sessions_used INTEGER;
  reset_date TIMESTAMPTZ;
  free_session_limit INTEGER := 2; -- This should match NEXT_PUBLIC_FREE_LISTENER_SESSIONS_PER_MONTH
BEGIN
  -- Get user's subscription info
  SELECT subscription_tier, listener_sessions_used, listener_sessions_reset_date
  INTO user_tier, sessions_used, reset_date
  FROM public.profiles
  WHERE id = user_id_param;

  -- Premium users have unlimited sessions
  IF user_tier = 'premium' THEN
    RETURN TRUE;
  END IF;

  -- Check if reset date has passed (more than 1 month ago)
  IF reset_date < NOW() - INTERVAL '1 month' THEN
    -- Reset the counter
    UPDATE public.profiles
    SET 
      listener_sessions_used = 0,
      listener_sessions_reset_date = NOW()
    WHERE id = user_id_param;
    
    RETURN TRUE;
  END IF;

  -- For free users, check if they're under the limit
  IF user_tier = 'free' THEN
    RETURN sessions_used < free_session_limit;
  END IF;

  -- For plus tier (if implemented), add logic here
  IF user_tier = 'plus' THEN
    RETURN sessions_used < free_session_limit;
  END IF;

  RETURN FALSE;
END;
$$;

-- Function to increment session usage
CREATE OR REPLACE FUNCTION increment_session_usage(user_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET listener_sessions_used = listener_sessions_used + 1
  WHERE id = user_id_param;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS! Subscription and age confirmation fields added!';
  RAISE NOTICE '✅ Listener bookings table created!';
  RAISE NOTICE '✅ Session limit enforcement functions created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Set up a monthly cron job to call reset_monthly_session_limits()';
  RAISE NOTICE '2. Update API routes to use can_book_listener_session()';
  RAISE NOTICE '3. Update booking flow to call increment_session_usage()';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Database ready for production!';
END $$;
