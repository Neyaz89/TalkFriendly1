-- ============================================
-- Fix: ALL Missing Foreign Key Relationships
-- ============================================
-- 
-- PROBLEM: Multiple foreign keys are missing:
-- 1. communities.owner_id → auth.users(id)
-- 2. community_messages.user_id → auth.users(id)
-- 3. community_members.user_id → auth.users(id)
--
-- These are needed for PostgREST to join tables
--
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Drop all existing foreign keys (clean slate)
-- ============================================

DO $$ 
BEGIN
  -- Communities foreign keys
  ALTER TABLE public.communities DROP CONSTRAINT IF EXISTS communities_owner_id_fkey CASCADE;
  ALTER TABLE public.communities DROP CONSTRAINT IF EXISTS fk_communities_owner CASCADE;
  
  -- Community members foreign keys
  ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_user_id_fkey CASCADE;
  ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_community_id_fkey CASCADE;
  ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS fk_community_members_user CASCADE;
  ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS fk_community_members_community CASCADE;
  
  -- Community messages foreign keys
  ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_user_id_fkey CASCADE;
  ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_community_id_fkey CASCADE;
  ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_reply_to_fkey CASCADE;
  ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS fk_community_messages_user CASCADE;
  ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS fk_community_messages_community CASCADE;
  
  RAISE NOTICE '✅ Dropped old constraints';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No old constraints to drop or error: %', SQLERRM;
END $$;

-- ============================================
-- STEP 2: Create ALL foreign keys properly
-- ============================================

-- Communities table foreign keys
ALTER TABLE public.communities
ADD CONSTRAINT communities_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Community members table foreign keys
ALTER TABLE public.community_members
ADD CONSTRAINT community_members_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.community_members
ADD CONSTRAINT community_members_community_id_fkey 
FOREIGN KEY (community_id) 
REFERENCES public.communities(id) 
ON DELETE CASCADE;

-- Community messages table foreign keys
ALTER TABLE public.community_messages
ADD CONSTRAINT community_messages_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.community_messages
ADD CONSTRAINT community_messages_community_id_fkey 
FOREIGN KEY (community_id) 
REFERENCES public.communities(id) 
ON DELETE CASCADE;

ALTER TABLE public.community_messages
ADD CONSTRAINT community_messages_reply_to_fkey 
FOREIGN KEY (reply_to) 
REFERENCES public.community_messages(id) 
ON DELETE SET NULL;

COMMIT;

-- ============================================
-- STEP 3: Verify all foreign keys were created
-- ============================================

DO $$
DECLARE
  communities_fk_count INTEGER;
  members_fk_count INTEGER;
  messages_fk_count INTEGER;
BEGIN
  -- Count foreign keys
  SELECT COUNT(*) INTO communities_fk_count
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'communities' AND contype = 'f';
  
  SELECT COUNT(*) INTO members_fk_count
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'community_members' AND contype = 'f';
  
  SELECT COUNT(*) INTO messages_fk_count
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  WHERE t.relname = 'community_messages' AND contype = 'f';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL FOREIGN KEYS CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'communities table: % foreign keys', communities_fk_count;
  RAISE NOTICE '  - owner_id → auth.users(id)';
  RAISE NOTICE '';
  RAISE NOTICE 'community_members table: % foreign keys', members_fk_count;
  RAISE NOTICE '  - user_id → auth.users(id)';
  RAISE NOTICE '  - community_id → communities(id)';
  RAISE NOTICE '';
  RAISE NOTICE 'community_messages table: % foreign keys', messages_fk_count;
  RAISE NOTICE '  - user_id → auth.users(id)';
  RAISE NOTICE '  - community_id → communities(id)';
  RAISE NOTICE '  - reply_to → community_messages(id)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 PostgREST can now join these tables!';
  RAISE NOTICE '🎉 Try opening your community again!';
  RAISE NOTICE '';
END $$;

-- Show all foreign keys for verification
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
WHERE tc.table_name IN ('communities', 'community_members', 'community_messages')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;
