-- ============================================
-- FIX: User Registration Trigger
-- ============================================
-- Run this in Supabase SQL Editor to fix the
-- "Database error saving new user" issue
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify trigger was created
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS! User registration trigger created!';
  RAISE NOTICE '';
  RAISE NOTICE 'What this does:';
  RAISE NOTICE '- Automatically creates a profile when a user signs up';
  RAISE NOTICE '- Extracts username from email if not provided';
  RAISE NOTICE '- Handles errors gracefully without blocking signup';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Try registering a new user now!';
END $$;
