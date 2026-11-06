-- ============================================================================
-- FIX: Auto-create profiles for new users
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Generate base username
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username', 
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Make username unique by adding numbers if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := COALESCE(
      NEW.raw_user_meta_data->>'username', 
      SPLIT_PART(NEW.email, '@', 1)
    ) || v_counter::TEXT;
  END LOOP;
  
  INSERT INTO public.profiles (id, username, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix existing users without profiles (with unique username generation)
DO $$
DECLARE
  v_user RECORD;
  v_username TEXT;
  v_counter INTEGER;
BEGIN
  FOR v_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON p.id = au.id
    WHERE p.id IS NULL
  LOOP
    -- Generate base username
    v_username := COALESCE(
      v_user.raw_user_meta_data->>'username',
      SPLIT_PART(v_user.email, '@', 1)
    );
    v_counter := 0;
    
    -- Make unique
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
      v_counter := v_counter + 1;
      v_username := COALESCE(
        v_user.raw_user_meta_data->>'username',
        SPLIT_PART(v_user.email, '@', 1)
      ) || v_counter::TEXT;
    END LOOP;
    
    -- Insert profile
    INSERT INTO public.profiles (id, username, email, full_name, created_at, updated_at)
    VALUES (
      v_user.id,
      v_username,
      v_user.email,
      COALESCE(v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created profile for user % with username %', v_user.email, v_username;
  END LOOP;
END $$;

-- Verify
SELECT 
  'Users in auth.users' as table_name, 
  COUNT(*) as count 
FROM auth.users
UNION ALL
SELECT 
  'Users in profiles' as table_name, 
  COUNT(*) as count 
FROM public.profiles;

-- Success message
DO $$
DECLARE
  v_auth_count INTEGER;
  v_profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_auth_count FROM auth.users;
  SELECT COUNT(*) INTO v_profile_count FROM public.profiles;
  
  RAISE NOTICE '✅ Profile auto-creation trigger installed!';
  RAISE NOTICE '✅ Fixed existing users: % users in auth, % users in profiles', v_auth_count, v_profile_count;
  
  IF v_auth_count = v_profile_count THEN
    RAISE NOTICE '🎉 All users now have profiles!';
  ELSE
    RAISE WARNING '⚠️  Some users still missing profiles. Count mismatch!';
  END IF;
END $$;
