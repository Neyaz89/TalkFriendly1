-- ============================================
-- TalkFriendly - Community System Migration
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Go to: https://app.supabase.com
-- 2. Select your TalkFriendly project
-- 3. Click "SQL Editor" in left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this ENTIRE file
-- 6. Click "Run" or press Ctrl+Enter
-- -7. Wait for success message
-- -
-- This migration adds:
-- ✅ Complete community system with chat
-- ✅ Voice message support
-- ✅ Role-based access control (Owner/Admin/Member)
-- ✅ Real-time messaging capabilities
-- ✅ Community invitations
-- -
-- ============================================ -

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: Update existing communities table
-- ============================================

-- Add new columns to existing communities table
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"allow_voice_messages": true, "allow_member_posts": true, "require_approval": false}'::jsonb;

-- Update existing communities to set a default owner if null
-- You may want to set this manually for existing communities
-- UPDATE public.communities SET owner_id = (SELECT id FROM auth.users LIMIT 1) WHERE owner_id IS NULL;

-- ============================================
-- STEP 2: Update community_members table
-- ============================================

-- Add role column with constraint and last_read_at for unread tracking
ALTER TABLE public.community_members 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

-- Update role constraint if it exists without the proper values
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'community_members_role_check' 
    AND table_name = 'community_members'
  ) THEN
    ALTER TABLE public.community_members DROP CONSTRAINT community_members_role_check;
    ALTER TABLE public.community_members ADD CONSTRAINT community_members_role_check 
      CHECK (role IN ('owner', 'admin', 'member'));
  END IF;
END $$;

-- ============================================
-- STEP 3: Create community_messages table
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'system')),
  voice_url TEXT,
  voice_duration INTEGER,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  reply_to UUID REFERENCES public.community_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 4: Create community_invites table
-- ============================================

CREATE TABLE IF NOT EXISTS public.community_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 5: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_community_members_community 
ON public.community_members(community_id);

CREATE INDEX IF NOT EXISTS idx_community_messages_community_created 
ON public.community_messages(community_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_messages_user 
ON public.community_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_communities_owner 
ON public.communities(owner_id);

CREATE INDEX IF NOT EXISTS idx_community_invites_community 
ON public.community_invites(community_id);

CREATE INDEX IF NOT EXISTS idx_community_invites_email 
ON public.community_invites(email);

-- ============================================
-- STEP 6: Enable Row Level Security
-- ============================================

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 7: Drop existing policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Anyone can view communities" ON public.communities;
DROP POLICY IF EXISTS "Anyone can view public communities" ON public.communities;
DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities;
DROP POLICY IF EXISTS "Owners can update their communities" ON public.communities;
DROP POLICY IF EXISTS "Owners can delete their communities" ON public.communities;

DROP POLICY IF EXISTS "Members can view community members" ON public.community_members;
DROP POLICY IF EXISTS "Users can join communities" ON public.community_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.community_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.community_members;

-- ============================================
-- STEP 8: Create RLS policies for communities
-- ============================================

CREATE POLICY "Anyone can view public communities" 
ON public.communities FOR SELECT 
USING (
  is_private = false 
  OR auth.uid() IN (
    SELECT user_id FROM public.community_members WHERE community_id = id
  )
);

CREATE POLICY "Authenticated users can create communities" 
ON public.communities FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their communities" 
ON public.communities FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their communities" 
ON public.communities FOR DELETE 
USING (auth.uid() = owner_id);

-- ============================================
-- STEP 9: Create RLS policies for community_members
-- ============================================

CREATE POLICY "Members can view community members" 
ON public.community_members FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.community_members 
    WHERE community_id = community_members.community_id
  )
);

CREATE POLICY "Users can join communities" 
ON public.community_members FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave or admins can remove members" 
ON public.community_members FOR DELETE 
USING (
  auth.uid() = user_id
  OR auth.uid() IN (
    SELECT user_id FROM public.community_members 
    WHERE community_id = community_members.community_id 
    AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update member roles" 
ON public.community_members FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.community_members 
    WHERE community_id = community_members.community_id 
    AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- STEP 10: Create RLS policies for community_messages
-- ============================================

CREATE POLICY "Members can view messages" 
ON public.community_messages FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.community_members 
    WHERE community_id = community_messages.community_id
  )
  AND is_deleted = false
);

CREATE POLICY "Members can send messages" 
ON public.community_messages FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND auth.uid() IN (
    SELECT user_id FROM public.community_members 
    WHERE community_id = community_messages.community_id
  )
);

CREATE POLICY "Users can update their messages" 
ON public.community_messages FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users and admins can delete messages" 
ON public.community_messages FOR DELETE 
USING (
  auth.uid() = user_id 
  OR auth.uid() IN (
    SELECT user_id FROM public.community_members 
    WHERE community_id = community_messages.community_id 
    AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- STEP 11: Create RLS policies for community_invites
-- ============================================

CREATE POLICY "Members can view invites" 
ON public.community_invites FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.community_members 
    WHERE community_id = community_invites.community_id
  )
);

CREATE POLICY "Admins can create invites" 
ON public.community_invites FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = invited_by 
  AND auth.uid() IN (
    SELECT user_id FROM public.community_members 
    WHERE community_id = community_invites.community_id 
    AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- STEP 12: Create trigger functions
-- ============================================

-- Function to add owner as member when community is created
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (community_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_add_owner_as_member ON public.communities;
CREATE TRIGGER trigger_add_owner_as_member
AFTER INSERT ON public.communities
FOR EACH ROW
EXECUTE FUNCTION add_owner_as_member();

-- Function to update member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Function to update community updated_at timestamp when message is sent
CREATE OR REPLACE FUNCTION update_community_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.communities 
  SET updated_at = NOW() 
  WHERE id = NEW.community_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_community_timestamp ON public.community_messages;
CREATE TRIGGER trigger_update_community_timestamp
AFTER INSERT ON public.community_messages
FOR EACH ROW
EXECUTE FUNCTION update_community_updated_at();

-- ============================================
-- STEP 13: Create Supabase Storage Bucket (if needed)
-- ============================================

-- Insert voice-messages bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 14: Create storage policies
-- ============================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Authenticated users can upload voice messages" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read voice messages" ON storage.objects;

-- Policy for uploading voice messages
CREATE POLICY "Authenticated users can upload voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voice-messages');

-- Policy for reading voice messages
CREATE POLICY "Anyone can read voice messages"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'voice-messages');

-- Policy for deleting own voice messages
CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[2]);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ Community System Migration Completed!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables created/updated:';
  RAISE NOTICE '   - communities (enhanced)';
  RAISE NOTICE '   - community_members (enhanced)';
  RAISE NOTICE '   - community_messages (new)';
  RAISE NOTICE '   - community_invites (new)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Row Level Security policies applied!';
  RAISE NOTICE '✅ Triggers created for automation!';
  RAISE NOTICE '✅ Indexes created for performance!';
  RAISE NOTICE '✅ Storage bucket configured!';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your community system is ready to use!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Enable Realtime for community_messages table';
  RAISE NOTICE '   2. Deploy your frontend code';
  RAISE NOTICE '   3. Test creating a community';
  RAISE NOTICE '';
END $$;
