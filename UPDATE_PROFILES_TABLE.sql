-- ============================================
-- Update Profiles Table - Safe to Run Anytime
-- ============================================
--
-- This adds the profession column if you already
-- created the profiles table from the previous schema.
--
-- INSTRUCTIONS:
-- 1. Go to: https://app.supabase.com
-- 2. SQL Editor → New Query
-- 3. Copy and paste this file
-- 4. Run it (Ctrl+Enter)
--
-- Safe to run multiple times!
-- ============================================

-- Add profession column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS profession TEXT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS! Profession column added to profiles table!';
  RAISE NOTICE '';
  RAISE NOTICE 'Your profiles table now has:';
  RAISE NOTICE '- id (UUID)';
  RAISE NOTICE '- username (TEXT)';
  RAISE NOTICE '- full_name (TEXT)';
  RAISE NOTICE '- email (TEXT)';
  RAISE NOTICE '- profession (TEXT) ← NEW!';
  RAISE NOTICE '- avatar_url (TEXT)';
  RAISE NOTICE '- bio (TEXT)';
  RAISE NOTICE '- created_at (TIMESTAMP)';
  RAISE NOTICE '- updated_at (TIMESTAMP)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Set up Supabase Storage for avatars';
  RAISE NOTICE 'Follow: SUPABASE_STORAGE_SETUP.md';
END $$;
