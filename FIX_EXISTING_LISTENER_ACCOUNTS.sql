-- ============================================
-- FIX: Update Existing Listener Accounts
-- ============================================
-- Updates profiles for users who registered as
-- listeners but got marked as regular users
-- ============================================

-- Step 1: Find users who have listener records but profile says 'user'
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  -- Update profiles to 'listener' for users who have listener records
  UPDATE public.profiles p
  SET account_type = 'listener',
      updated_at = NOW()
  FROM public.listeners l
  WHERE p.id = l.user_id
    AND p.account_type != 'listener';
  
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Fixed % listener accounts', fixed_count;
END $$;

-- Step 2: Also mark verified listeners in profiles
DO $$
DECLARE
  verified_count INTEGER;
BEGIN
  -- Update is_verified for listeners with verified status
  UPDATE public.profiles p
  SET is_verified = true,
      updated_at = NOW()
  FROM public.listeners l
  WHERE p.id = l.user_id
    AND l.verification_status = 'verified'
    AND p.is_verified != true;
  
  GET DIAGNOSTICS verified_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Marked % listeners as verified', verified_count;
END $$;

-- Step 3: Verify the fix
DO $$
DECLARE
  listener_count INTEGER;
  verified_listener_count INTEGER;
BEGIN
  -- Count listeners with correct account_type
  SELECT COUNT(*) INTO listener_count
  FROM public.profiles p
  INNER JOIN public.listeners l ON p.id = l.user_id
  WHERE p.account_type = 'listener';
  
  -- Count verified listeners
  SELECT COUNT(*) INTO verified_listener_count
  FROM public.profiles p
  INNER JOIN public.listeners l ON p.id = l.user_id
  WHERE p.account_type = 'listener'
    AND p.is_verified = true
    AND l.verification_status = 'verified';
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '  FIX COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Listener accounts fixed:';
  RAISE NOTICE '  • Total listeners: %', listener_count;
  RAISE NOTICE '  • Verified listeners: %', verified_listener_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 All existing listener accounts have been fixed!';
  RAISE NOTICE '';
  RAISE NOTICE 'What was fixed:';
  RAISE NOTICE '  1. ✅ profiles.account_type updated to ''listener''';
  RAISE NOTICE '  2. ✅ profiles.is_verified set for verified listeners';
  RAISE NOTICE '';
END $$;

-- Optional: Show all listener accounts
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.account_type,
  p.is_verified,
  l.verification_status,
  l.professional_title
FROM public.profiles p
INNER JOIN public.listeners l ON p.id = l.user_id
ORDER BY p.created_at DESC;
