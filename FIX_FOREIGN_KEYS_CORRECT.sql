'-- ============================================
'-- CORRECT Fix: Foreign Keys to profiles table
'-- ============================================
'-- 
'-- THE REAL PROBLEM: We were pointing to auth.users
'-- but PostgREST needs to join with public.profiles!
'--
'-- Run this in Supabase SQL Editor
'-- ============================================
'
'BEGIN;
'
'-- Drop wrong foreign keys
'ALTER TABLE public.communities DROP CONSTRAINT IF EXISTS communities_owner_id_fkey CASCADE;
'ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_user_id_fkey CASCADE;
'ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_community_id_fkey CASCADE;
'ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_user_id_fkey CASCADE;
'ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_community_id_fkey CASCADE;
'ALTER TABLE public.community_messages DROP CONSTRAINT IF EXISTS community_messages_reply_to_fkey CASCADE;
'
'-- ============================================
'-- Create CORRECT foreign keys
'-- ============================================
'
'-- communities.owner_id → profiles.id (NOT auth.users!)
'ALTER TABLE public.communities
'ADD CONSTRAINT communities_owner_id_fkey 
'FOREIGN KEY (owner_id) 
'REFERENCES public.profiles(id) 
'ON DELETE CASCADE;
'
'-- community_members foreign keys
'ALTER TABLE public.community_members
'ADD CONSTRAINT community_members_user_id_fkey 
'FOREIGN KEY (user_id) 
'REFERENCES public.profiles(id) 
'ON DELETE CASCADE;
'
'ALTER TABLE public.community_members
'ADD CONSTRAINT community_members_community_id_fkey 
'FOREIGN KEY (community_id) 
'REFERENCES public.communities(id) 
'ON DELETE CASCADE;
'
'-- community_messages foreign keys
'ALTER TABLE public.community_messages
'ADD CONSTRAINT community_messages_user_id_fkey 
'FOREIGN KEY (user_id) 
'REFERENCES public.profiles(id) 
'ON DELETE CASCADE;
'
'ALTER TABLE public.community_messages
'ADD CONSTRAINT community_messages_community_id_fkey 
'FOREIGN KEY (community_id) 
'REFERENCES public.communities(id) 
'ON DELETE CASCADE;
'
'ALTER TABLE public.community_messages
'ADD CONSTRAINT community_messages_reply_to_fkey 
'FOREIGN KEY (reply_to) 
'REFERENCES public.community_messages(id) 
'ON DELETE SET NULL;
'
'COMMIT;
'
'-- ============================================
'-- Refresh PostgREST schema cache
'-- ============================================
'
'NOTIFY pgrst, 'reload schema';
'
'-- Verify
'SELECT 
'  tc.table_name,
'  kcu.column_name,
'  ccu.table_schema || '.' || ccu.table_name AS foreign_table,
'  ccu.column_name AS foreign_column
'FROM information_schema.table_constraints AS tc 
'JOIN information_schema.key_column_usage AS kcu
'  ON tc.constraint_name = kcu.constraint_name
'JOIN information_schema.constraint_column_usage AS ccu
'  ON ccu.constraint_name = tc.constraint_name
'WHERE tc.table_name IN ('communities', 'community_members', 'community_messages')
'AND tc.constraint_type = 'FOREIGN KEY'
'ORDER BY tc.table_name;
'
'DO $$
'BEGIN
'  RAISE NOTICE '';
'  RAISE NOTICE '========================================';
'  RAISE NOTICE '✅ FOREIGN KEYS FIXED!';
'  RAISE NOTICE '========================================';
'  RAISE NOTICE '';
'  RAISE NOTICE 'All foreign keys now point to public.profiles';
'  RAISE NOTICE 'PostgREST schema cache refreshed';
'  RAISE NOTICE '';
'  RAISE NOTICE '🎉 Try opening community NOW!';
'  RAISE NOTICE '';
'END $$;
']\43;'
1'24].0UPOK'3'