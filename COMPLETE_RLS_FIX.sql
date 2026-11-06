-- ============================================================================
-- COMPLETE FIX: RLS Policies for Registration Flow
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Fix profiles table RLS
-- ============================================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
DROP POLICY IF EXISTS "Public can view verified listeners" ON profiles;

-- Create new policies

-- 1a. Allow authenticated users to INSERT their own profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 1b. Allow authenticated users to SELECT their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 1c. Allow authenticated users to UPDATE their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 1d. Allow service role full access (for server-side operations and triggers)
CREATE POLICY "Service role full access to profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 1e. Allow public to view verified listener profiles (for discovery)
CREATE POLICY "Public can view verified listeners"
ON profiles FOR SELECT
TO anon, authenticated
USING (
  account_type IN ('listener', 'doctor') 
  AND is_verified = true
);

-- 2. Recreate auto-profile trigger with SECURITY DEFINER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER -- This bypasses RLS
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_counter INTEGER := 0;
  v_account_type TEXT;
BEGIN
  -- Get account type from metadata
  v_account_type := COALESCE(
    NEW.raw_user_meta_data->>'account_type',
    'user'
  );

  -- Generate base username from email
  v_username := SPLIT_PART(NEW.email, '@', 1);
  
  -- Make username unique by adding numbers if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := SPLIT_PART(NEW.email, '@', 1) || v_counter::TEXT;
  END LOOP;
  
  -- Insert profile (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO public.profiles (
    id, 
    username, 
    email, 
    full_name,
    account_type,
    is_verified,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      v_username
    ),
    v_account_type,
    CASE WHEN v_account_type = 'admin' THEN true ELSE false END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix listener_applications RLS
-- ============================================================================

ALTER TABLE listener_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own application" ON listener_applications;
DROP POLICY IF EXISTS "Users can view own application" ON listener_applications;
DROP POLICY IF EXISTS "Users can update own application" ON listener_applications;
DROP POLICY IF EXISTS "Service role full access" ON listener_applications;

-- Create new policies
CREATE POLICY "Users can insert own application"
ON listener_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own application"
ON listener_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own application"
ON listener_applications FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND status IN ('draft', 'additional_info_required')
)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to applications"
ON listener_applications FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Fix listeners table RLS
-- ============================================================================

ALTER TABLE listeners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own listener profile" ON listeners;
DROP POLICY IF EXISTS "Public can view verified listeners" ON listeners;
DROP POLICY IF EXISTS "Service role full access" ON listeners;

-- Create new policies
CREATE POLICY "Users can view own listener profile"
ON listeners FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Public can view verified listeners"
ON listeners FOR SELECT
TO anon, authenticated
USING (verification_status = 'verified');

CREATE POLICY "Service role full access to listeners"
ON listeners FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Verify all policies
-- ============================================================================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename IN ('profiles', 'listener_applications', 'listeners')
ORDER BY tablename, policyname;

-- 6. Test queries (optional - these should all work)
-- ============================================================================

-- Should return current user's profile
-- SELECT * FROM profiles WHERE id = auth.uid();

-- Should return current user's application
-- SELECT * FROM listener_applications WHERE user_id = auth.uid();

-- Should return all verified listeners
-- SELECT * FROM listeners WHERE verification_status = 'verified';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully!';
  RAISE NOTICE '✅ Profiles: Auto-creation trigger with SECURITY DEFINER';
  RAISE NOTICE '✅ Listener applications: User can manage own applications';
  RAISE NOTICE '✅ Listeners: Public can view verified, users can view own';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Registration flow should now work properly!';
END $$;
