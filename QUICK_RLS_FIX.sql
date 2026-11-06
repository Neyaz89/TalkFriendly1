-- QUICK FIX: Just run this in Supabase SQL Editor
-- This allows users to create their own profile during registration

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow service role full access (for triggers)
DROP POLICY IF EXISTS "Service role full access to profiles" ON profiles;
CREATE POLICY "Service role full access to profiles"
ON profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Fix the trigger to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_counter INTEGER := 0;
BEGIN
  v_username := SPLIT_PART(NEW.email, '@', 1);
  
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := SPLIT_PART(NEW.email, '@', 1) || v_counter::TEXT;
  END LOOP;
  
  INSERT INTO profiles (id, username, email, full_name, account_type, created_at, updated_at)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', v_username),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'user'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

SELECT '✅ Quick RLS fix applied! Try registering again.' as message;
