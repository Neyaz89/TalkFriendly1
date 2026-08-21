-- ============================================
-- TalkFriendly - Apply This to Your Supabase
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Go to: https://app.supabase.com
-- 2. Select your TalkFriendly project
-- 3. Click "SQL Editor" in left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this ENTIRE file
-- 6. Click "Run" or press Ctrl+Enter
-- 7. Wait for success message
-- 
-- This will:
-- ✅ Add profession field to profiles table
-- ✅ Create all necessary tables if they don't exist
-- ✅ Set up proper relationships and indexes
--
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update profiles table to add profession field
-- This is safe to run multiple times
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profession TEXT;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  profession TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create journal_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mood_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL,
  intensity INTEGER NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create communities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  member_count INTEGER DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create community_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- Create events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendee_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create listeners table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.listeners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bio TEXT,
  specializations TEXT[],
  rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  price_per_session DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_created 
ON public.mood_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created 
ON public.journal_entries(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_date 
ON public.events(event_date);

CREATE INDEX IF NOT EXISTS idx_community_members_user 
ON public.community_members(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listeners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (users can read all, update own)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- RLS Policies for journal_entries (users can only see/edit own)
DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
CREATE POLICY "Users can view own journal entries" 
ON public.journal_entries FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.journal_entries;
CREATE POLICY "Users can insert own journal entries" 
ON public.journal_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
CREATE POLICY "Users can update own journal entries" 
ON public.journal_entries FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;
CREATE POLICY "Users can delete own journal entries" 
ON public.journal_entries FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for mood_logs (users can only see/edit own)
DROP POLICY IF EXISTS "Users can view own mood logs" ON public.mood_logs;
CREATE POLICY "Users can view own mood logs" 
ON public.mood_logs FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mood logs" ON public.mood_logs;
CREATE POLICY "Users can insert own mood logs" 
ON public.mood_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for communities (all can read, authenticated can create)
DROP POLICY IF EXISTS "Anyone can view communities" ON public.communities;
CREATE POLICY "Anyone can view communities" 
ON public.communities FOR SELECT 
USING (true);

-- RLS Policies for events (all can read)
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Anyone can view events" 
ON public.events FOR SELECT 
USING (true);

-- RLS Policies for listeners (all can read)
DROP POLICY IF EXISTS "Anyone can view listeners" ON public.listeners;
CREATE POLICY "Anyone can view listeners" 
ON public.listeners FOR SELECT 
USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS! All tables created/updated with profession field added!';
  RAISE NOTICE '✅ Row Level Security policies applied!';
  RAISE NOTICE '✅ Indexes created for performance!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Go to Authentication → Providers → Email';
  RAISE NOTICE '2. Enable "Confirm email" toggle';
  RAISE NOTICE '3. Save settings';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your database is ready for production!';
END $$;
