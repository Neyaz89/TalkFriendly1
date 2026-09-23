-- ============================================
-- Fix: Communities Getting Deleted on Refresh
-- ============================================
-- 
-- PROBLEM: Communities are being deleted when page refreshes
-- CAUSE: Likely a CASCADE delete or bad trigger
--
-- SOLUTION: Check and fix foreign key constraints
-- ============================================

-- Check current foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('communities', 'community_members')
AND tc.constraint_type = 'FOREIGN KEY';

-- Show all triggers on communities table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('communities', 'community_members')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- Verify no auto-delete triggers exist
-- ============================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  -- Check for any DELETE triggers on communities
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE event_object_table = 'communities'
  AND event_manipulation = 'DELETE';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '⚠️  Found % DELETE triggers on communities table', trigger_count;
  ELSE
    RAISE NOTICE '✅ No DELETE triggers on communities table';
  END IF;
  
  -- Check member_count trigger
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'trigger_update_member_count_delete';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Member count trigger exists';
  ELSE
    RAISE NOTICE '⚠️  Member count trigger missing';
  END IF;
END $$;

-- ============================================
-- IMPORTANT: Check your actual data
-- ============================================

-- List all communities (should not be empty after creation)
SELECT 
  id,
  name,
  owner_id,
  member_count,
  created_at
FROM public.communities
ORDER BY created_at DESC
LIMIT 10;

-- List all community members
SELECT 
  cm.id,
  cm.community_id,
  cm.user_id,
  cm.role,
  c.name as community_name
FROM public.community_members cm
JOIN public.communities c ON c.id = cm.community_id
ORDER BY cm.joined_at DESC
LIMIT 10;

