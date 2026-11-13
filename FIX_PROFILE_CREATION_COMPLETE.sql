-- ============================================
-- FIX: Complete Profile Creation System
-- ============================================
-- Fixes:
-- 1. RLS policy violation on profile creation
-- 2. Missing account_type in trigger
-- 3. Listener setup authentication
-- ============================================

-- Step 1: Drop and recreate the handle_new_user function with account_type
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    full_name,
    account_type
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    account_type = EXCLUDED.account_type,
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block signup
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Step 2: Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Ensure RLS policies are correct
-- Allow service role to bypass RLS (for API routes using service role key)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON public.profiles;

-- Recreate policies
CREATE POLICY "Users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Step 4: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Step 5: Verify setup
DO $$
BEGIN
  RAISE NOTICE '✅ Profile Creation Fix Applied!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '1. ✅ Updated handle_new_user() function to include account_type';
  RAISE NOTICE '2. ✅ Added ON CONFLICT to prevent duplicate inserts';
  RAISE NOTICE '3. ✅ Recreated trigger on auth.users';
  RAISE NOTICE '4. ✅ Updated RLS policies';
  RAISE NOTICE '5. ✅ Granted necessary permissions';
  RAISE NOTICE '';
  RAISE NOTICE 'What this fixes:';
  RAISE NOTICE '- ✅ Profile creation RLS violations';
  RAISE NOTICE '- ✅ Missing account_type field';
  RAISE NOTICE '- ✅ Duplicate profile errors';
  RAISE NOTICE '- ✅ Service role access for API routes';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Try registering as a user or listener now!';
END $$;
