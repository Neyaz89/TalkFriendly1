-- ============================================
-- Fix: Missing Foreign Key Relationship
-- ============================================
-- 
-- ERROR: "Could not find a relationship between 'communities' and 'profiles'"
-- CAUSE: owner_id column exists but foreign key constraint is missing
-- SOLUTION: Add the foreign key constraint
--
-- Run this in Supabase SQL Editor
-- ============================================

-- First, check if the constraint already exists
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'communities'
AND n.nspname = 'public'
AND contype = 'f';

-- ============================================
-- Drop the old constraint if it exists with wrong name
-- ============================================

-- Drop any existing owner_id constraints
DO $$ 
BEGIN
  -- Try to drop if exists
  ALTER TABLE public.communities 
  DROP CONSTRAINT IF EXISTS communities_owner_id_fkey;
  
  ALTER TABLE public.communities 
  DROP CONSTRAINT IF EXISTS fk_communities_owner;
  
  RAISE NOTICE 'Dropped old constraints (if any)';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No old constraints to drop';
END $$;

-- ============================================
-- Add the correct foreign key constraint
-- ============================================

ALTER TABLE public.communities
ADD CONSTRAINT communities_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- ============================================
-- Verify the foreign key was created
-- ============================================

DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE t.relname = 'communities'
    AND n.nspname = 'public'
    AND contype = 'f'
    AND conname = 'communities_owner_id_fkey'
  ) INTO fk_exists;
  
  IF fk_exists THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ FOREIGN KEY CREATED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'communities.owner_id → auth.users(id)';
    RAISE NOTICE 'ON DELETE CASCADE';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Try refreshing your community page now!';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '❌ Foreign key was not created!';
  END IF;
END $$;
