-- ============================================
-- Verify Community System Setup
-- ============================================
-- Run this in Supabase SQL Editor to verify
-- your migration was applied successfully
-- ============================================

DO $$
DECLARE
  owner_id_exists BOOLEAN;
  trigger_exists BOOLEAN;
  bucket_exists BOOLEAN;
  policy_exists BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Checking Community System Setup...';
  RAISE NOTICE '';
  
  -- Check 1: Verify owner_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'communities' 
    AND column_name = 'owner_id'
  ) INTO owner_id_exists;
  
  IF owner_id_exists THEN
    RAISE NOTICE '✅ Column "owner_id" exists in communities table';
  ELSE
    RAISE NOTICE '❌ Column "owner_id" NOT FOUND - Migration may not have run!';
  END IF;
  
  -- Check 2: Verify trigger exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_add_owner_as_member'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Trigger "trigger_add_owner_as_member" exists';
  ELSE
    RAISE NOTICE '❌ Trigger NOT FOUND - Members will not be auto-created!';
  END IF;
  
  -- Check 3: Verify storage bucket exists
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE id = 'voice-messages'
  ) INTO bucket_exists;
  
  IF bucket_exists THEN
    RAISE NOTICE '✅ Storage bucket "voice-messages" exists';
  ELSE
    RAISE NOTICE '⚠️  Storage bucket NOT FOUND - Voice messages will fail!';
  END IF;
  
  -- Check 4: Verify RLS policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'communities'
    AND policyname = 'Authenticated users can create communities'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    RAISE NOTICE '✅ RLS Policy "Authenticated users can create communities" exists';
  ELSE
    RAISE NOTICE '❌ RLS Policy NOT FOUND - Community creation will fail!';
  END IF;
  
  RAISE NOTICE '';
  
  -- Summary
  IF owner_id_exists AND trigger_exists AND policy_exists THEN
    RAISE NOTICE '🎉 ALL CHECKS PASSED! Community system is ready!';
  ELSE
    RAISE NOTICE '⚠️  SOME CHECKS FAILED - Please re-run migration 002_community_system.sql';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Show all columns in communities table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'communities'
ORDER BY ordinal_position;

