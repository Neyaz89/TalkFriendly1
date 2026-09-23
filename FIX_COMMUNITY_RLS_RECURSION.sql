-- ============================================
-- Fix: Infinite Recursion in Community Members RLS
-- ============================================
-- 
-- PROBLEM: The RLS policies on community_members create
-- infinite recursion when the trigger tries to add owner
--
-- SOLUTION: Simplify policies to avoid recursion
--
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop ALL existing community_members policies
DROP POLICY IF EXISTS "Members can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave or admins can remove members" ON public.community_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.community_members;
DROP POLICY IF EXISTS "Users can leave communities" ON public.community_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.community_members;

-- ============================================
-- New RLS Policies (No Recursion)
-- ============================================

-- Policy 1: Anyone can view community members
-- (No subquery needed - prevents recursion)
CREATE POLICY "Anyone can view community members" 
ON public.community_members 
FOR SELECT 
USING (true);

-- Policy 2: Authenticated users can insert themselves as members
-- (Simple check - no subquery)
CREATE POLICY "Users can join communities" 
ON public.community_members 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can remove themselves (leave)
-- Admins/owners handled by separate policy
CREATE POLICY "Users can leave communities" 
ON public.community_members 
FOR DELETE 
USING (auth.uid() = user_id);

-- Policy 4: Community owners can manage members
-- Use owner_id from communities table directly
CREATE POLICY "Owners can manage members"
ON public.community_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.communities
    WHERE id = community_members.community_id
    AND owner_id = auth.uid()
  )
);

-- ============================================
-- Update Trigger Function to Use SECURITY DEFINER
-- ============================================
-- This allows the trigger to bypass RLS entirely

CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert owner as member, bypassing RLS due to SECURITY DEFINER
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (community_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with updated function
DROP TRIGGER IF EXISTS trigger_add_owner_as_member ON public.communities;
CREATE TRIGGER trigger_add_owner_as_member
AFTER INSERT ON public.communities
FOR EACH ROW
EXECUTE FUNCTION add_owner_as_member();

-- ============================================
-- Verify Fix
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Community Members RLS policies updated!';
  RAISE NOTICE '✅ Trigger function updated with SECURITY DEFINER!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Changes made:';
  RAISE NOTICE '   - Removed recursive policies';
  RAISE NOTICE '   - Simplified member viewing (no restrictions)';
  RAISE NOTICE '   - Trigger now bypasses RLS using SECURITY DEFINER';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Try creating a community again!';
  RAISE NOTICE '';
END $$;
