-- ============================================
-- COMPLETE FIX: All Community RLS Recursion Issues
-- ============================================
-- 
-- PROBLEM: RLS policies on both communities and 
-- community_members tables have infinite recursion
--
-- SOLUTION: Remove ALL problematic policies and 
-- create simple, non-recursive policies
--
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: Drop ALL existing policies
-- ============================================

-- Drop communities policies (all possible variations)
DROP POLICY IF EXISTS "Anyone can view communities" ON public.communities;
DROP POLICY IF EXISTS "Anyone can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Owners can update their communities" ON public.communities;
DROP POLICY IF EXISTS "Owners can delete their communities" ON public.communities;
DROP POLICY IF EXISTS "Users can view all communities" ON public.communities;
DROP POLICY IF EXISTS "communities_select_policy" ON public.communities;
DROP POLICY IF EXISTS "communities_insert_policy" ON public.communities;
DROP POLICY IF EXISTS "communities_update_policy" ON public.communities;
DROP POLICY IF EXISTS "communities_delete_policy" ON public.communities;

-- Drop community_members policies (all possible variations)
DROP POLICY IF EXISTS "Members can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave or admins can remove members" ON public.community_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.community_members;
DROP POLICY IF EXISTS "Anyone can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Owners can manage members" ON public.community_members;
DROP POLICY IF EXISTS "community_members_select_policy" ON public.community_members;
DROP POLICY IF EXISTS "community_members_insert_policy" ON public.community_members;
DROP POLICY IF EXISTS "community_members_update_policy" ON public.community_members;
DROP POLICY IF EXISTS "community_members_delete_policy" ON public.community_members;

-- ============================================
-- STEP 2: Create NEW simple policies for COMMUNITIES
-- ============================================

-- SELECT: Anyone can view all communities (public and private for now)
CREATE POLICY "communities_select_policy" 
ON public.communities 
FOR SELECT 
USING (true);

-- INSERT: Authenticated users can create communities
-- Simple check: user must be authenticated and owner_id must match their ID
CREATE POLICY "communities_insert_policy" 
ON public.communities 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- UPDATE: Only owner can update their community
-- Direct owner_id check, no subquery
CREATE POLICY "communities_update_policy" 
ON public.communities 
FOR UPDATE 
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- DELETE: Only owner can delete their community
CREATE POLICY "communities_delete_policy" 
ON public.communities 
FOR DELETE 
TO authenticated
USING (auth.uid() = owner_id);

-- ============================================
-- STEP 3: Create NEW simple policies for COMMUNITY_MEMBERS
-- ============================================

-- SELECT: Anyone can view community members
CREATE POLICY "community_members_select_policy" 
ON public.community_members 
FOR SELECT 
USING (true);

-- INSERT: Users can join communities as themselves
-- Triggers can also insert (SECURITY DEFINER bypasses this)
CREATE POLICY "community_members_insert_policy" 
ON public.community_members 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can only update their own membership (e.g., last_read_at)
CREATE POLICY "community_members_update_policy" 
ON public.community_members 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can leave (delete their own membership)
CREATE POLICY "community_members_delete_policy" 
ON public.community_members 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- STEP 4: Update trigger functions to use SECURITY DEFINER
-- ============================================

-- This allows triggers to bypass RLS completely
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert owner as member with 'owner' role
  -- SECURITY DEFINER means this bypasses RLS
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (community_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_add_owner_as_member ON public.communities;
CREATE TRIGGER trigger_add_owner_as_member
AFTER INSERT ON public.communities
FOR EACH ROW
EXECUTE FUNCTION add_owner_as_member();

-- Update member count trigger function
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities 
    SET member_count = member_count + 1 
    WHERE id = NEW.community_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities 
    SET member_count = GREATEST(member_count - 1, 0)
    WHERE id = OLD.community_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate member count triggers
DROP TRIGGER IF EXISTS trigger_update_member_count_insert ON public.community_members;
CREATE TRIGGER trigger_update_member_count_insert
AFTER INSERT ON public.community_members
FOR EACH ROW
EXECUTE FUNCTION update_community_member_count();

DROP TRIGGER IF EXISTS trigger_update_member_count_delete ON public.community_members;
CREATE TRIGGER trigger_update_member_count_delete
AFTER DELETE ON public.community_members
FOR EACH ROW
EXECUTE FUNCTION update_community_member_count();

-- Update community timestamp trigger function
CREATE OR REPLACE FUNCTION update_community_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.communities 
  SET updated_at = NOW() 
  WHERE id = NEW.community_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate timestamp trigger
DROP TRIGGER IF EXISTS trigger_update_community_timestamp ON public.community_messages;
CREATE TRIGGER trigger_update_community_timestamp
AFTER INSERT ON public.community_messages
FOR EACH ROW
EXECUTE FUNCTION update_community_updated_at();

COMMIT;

-- ============================================
-- Verification and Success Message
-- ============================================

DO $$
DECLARE
  communities_policies INTEGER;
  members_policies INTEGER;
BEGIN
  -- Count policies
  SELECT COUNT(*) INTO communities_policies
  FROM pg_policies 
  WHERE tablename = 'communities';
  
  SELECT COUNT(*) INTO members_policies
  FROM pg_policies 
  WHERE tablename = 'community_members';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMMUNITY RLS FIX COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Removed all recursive policies';
  RAISE NOTICE '✅ Created % simple policies for communities', communities_policies;
  RAISE NOTICE '✅ Created % simple policies for community_members', members_policies;
  RAISE NOTICE '✅ Updated all triggers with SECURITY DEFINER';
  RAISE NOTICE '';
  RAISE NOTICE '📝 New Policy Structure:';
  RAISE NOTICE '   Communities:';
  RAISE NOTICE '   - SELECT: Anyone can view';
  RAISE NOTICE '   - INSERT: Authenticated users, owner_id = auth.uid()';
  RAISE NOTICE '   - UPDATE: Only owner';
  RAISE NOTICE '   - DELETE: Only owner';
  RAISE NOTICE '';
  RAISE NOTICE '   Community Members:';
  RAISE NOTICE '   - SELECT: Anyone can view';
  RAISE NOTICE '   - INSERT: Users as themselves';
  RAISE NOTICE '   - UPDATE: Only own membership';
  RAISE NOTICE '   - DELETE: Only own membership';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Try creating a community now!';
  RAISE NOTICE '';
END $$;

