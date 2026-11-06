-- ============================================
-- TalkFriendly - Social Connection & Chat System Migration
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. Go to: https://app.supabase.com/project/czdltlqhmeqyvogomqxt/sql
-- 2. Click "New Query"
-- 3. Copy and paste this ENTIRE file
-- 4. Click "Run" or press Ctrl+Enter
-- 5. Wait for success message
-- 
-- This migration adds:
-- ✅ Account types (User/Listener/Doctor roles)
-- ✅ Doctor profiles and verification
-- ✅ Connection request system
-- ✅ Accepted connections
-- ✅ Community feed posts
-- ✅ 1-to-1 chat conversations and messages
-- ✅ Voice message support for chat
-- ✅ Doctor ratings and reviews
-- ✅ User blocking
-- ✅ Reporting system
-- ✅ Notifications
-- ✅ All RLS policies for security
-- 
-- SAFE: Does not modify existing tables, only extends them
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: Extend profiles table with account types
-- ============================================

-- Add account_type field to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'user' CHECK (account_type IN ('user', 'listener', 'doctor', 'admin'));

-- Add additional fields for enhanced profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS age_confirmed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for account type queries
CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON public.profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- ============================================
-- STEP 2: Extend listeners table for doctor profiles
-- ============================================

-- Add doctor-specific fields to existing listeners table
ALTER TABLE public.listeners
ADD COLUMN IF NOT EXISTS professional_title TEXT,
ADD COLUMN IF NOT EXISTS qualifications TEXT[],
ADD COLUMN IF NOT EXISTS license_number TEXT,
ADD COLUMN IF NOT EXISTS specialization TEXT[],
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[],
ADD COLUMN IF NOT EXISTS consultation_fee INTEGER,
ADD COLUMN IF NOT EXISTS accepts_new_patients BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_documents TEXT[],
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS allow_messages BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_doctor BOOLEAN DEFAULT false;

-- Create indexes for doctor queries
CREATE INDEX IF NOT EXISTS idx_listeners_is_doctor ON public.listeners(is_doctor);
CREATE INDEX IF NOT EXISTS idx_listeners_verification_status ON public.listeners(verification_status);
CREATE INDEX IF NOT EXISTS idx_listeners_accepts_patients ON public.listeners(accepts_new_patients);

-- ============================================
-- STEP 3: Create connection_requests table
-- ============================================

CREATE TABLE IF NOT EXISTS public.connection_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id),
  CHECK (sender_id != receiver_id)
);

-- Create indexes for connection queries
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender ON public.connection_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver ON public.connection_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_created ON public.connection_requests(created_at DESC);

-- ============================================
-- STEP 4: Create connections table (accepted connections)
-- ============================================

CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_id_2 UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2)
);

-- Create indexes for bidirectional connection queries
CREATE INDEX IF NOT EXISTS idx_connections_user1 ON public.connections(user_id_1);
CREATE INDEX IF NOT EXISTS idx_connections_user2 ON public.connections(user_id_2);

-- ============================================
-- STEP 5: Create feed_posts table (community feed)
-- ============================================

CREATE TABLE IF NOT EXISTS public.feed_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  post_type TEXT DEFAULT 'text' CHECK (post_type IN ('text', 'poll', 'article')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'connections', 'private')),
  media_urls TEXT[],
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for feed queries
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON public.feed_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON public.feed_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_posts_visibility ON public.feed_posts(visibility);

-- ============================================
-- STEP 6: Create conversations table (1-to-1 chat)
-- ============================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  participant_2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id),
  CHECK (participant_1_id < participant_2_id)
);

-- Create indexes for conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_participant1 ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2 ON public.conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- ============================================
-- STEP 7: Create messages table (chat messages)
-- ============================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'system')),
  voice_url TEXT,
  voice_duration INTEGER,
  is_read BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for message queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(conversation_id, is_read);

-- ============================================
-- STEP 8: Create doctor_reviews table
-- ============================================

CREATE TABLE IF NOT EXISTS public.doctor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES public.listeners(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_booking BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, reviewer_id, booking_id)
);

-- Create indexes for review queries
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_doctor ON public.doctor_reviews(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_reviewer ON public.doctor_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_created ON public.doctor_reviews(created_at DESC);

-- ============================================
-- STEP 9: Create blocks table
-- ============================================

CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Create indexes for block queries
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON public.blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON public.blocks(blocked_id);

-- ============================================
-- STEP 10: Create reports table
-- ============================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('user', 'post', 'message', 'community')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for report queries
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON public.reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.reports(created_at DESC);

-- ============================================
-- STEP 11: Create notifications table
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'connection_request', 'connection_accepted', 'message', 
    'comment', 'like', 'mention', 'review', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================
-- STEP 12: Create post_likes table (for feed engagement)
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes for like queries
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);

-- ============================================
-- STEP 13: Create post_comments table
-- ============================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for comment queries
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON public.post_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_comment_id);

-- ============================================
-- STEP 14: Enable Row Level Security on all new tables
-- ============================================

ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 15: Create RLS policies for connection_requests
-- ============================================

CREATE POLICY "Users can view their own sent requests"
ON public.connection_requests FOR SELECT
USING (auth.uid() = sender_id);

CREATE POLICY "Users can view their received requests"
ON public.connection_requests FOR SELECT
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can send connection requests"
ON public.connection_requests FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.blocks 
    WHERE (blocker_id = sender_id AND blocked_id = receiver_id)
    OR (blocker_id = receiver_id AND blocked_id = sender_id)
  )
);

CREATE POLICY "Users can update their own sent requests"
ON public.connection_requests FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests"
ON public.connection_requests FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own requests"
ON public.connection_requests FOR DELETE
USING (auth.uid() = sender_id);

-- ============================================
-- STEP 16: Create RLS policies for connections
-- ============================================

CREATE POLICY "Users can view their connections"
ON public.connections FOR SELECT
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "System can create connections"
ON public.connections FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Users can delete their connections"
ON public.connections FOR DELETE
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- ============================================
-- STEP 17: Create RLS policies for feed_posts
-- ============================================

CREATE POLICY "Users can view public posts"
ON public.feed_posts FOR SELECT
USING (
  visibility = 'public' 
  AND is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM public.blocks 
    WHERE (blocker_id = auth.uid() AND blocked_id = author_id)
    OR (blocker_id = author_id AND blocked_id = auth.uid())
  )
);

CREATE POLICY "Users can view their own posts"
ON public.feed_posts FOR SELECT
USING (auth.uid() = author_id);

CREATE POLICY "Users can view connection posts"
ON public.feed_posts FOR SELECT
USING (
  visibility = 'connections'
  AND is_deleted = false
  AND (
    EXISTS (
      SELECT 1 FROM public.connections 
      WHERE (user_id_1 = auth.uid() AND user_id_2 = author_id)
      OR (user_id_2 = auth.uid() AND user_id_1 = author_id)
    )
    OR auth.uid() = author_id
  )
);

CREATE POLICY "Users can create posts"
ON public.feed_posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
ON public.feed_posts FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
ON public.feed_posts FOR DELETE
USING (auth.uid() = author_id);

-- ============================================
-- STEP 18: Create RLS policies for conversations
-- ============================================

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = participant_1_id OR auth.uid() = participant_2_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.blocks 
    WHERE (blocker_id = participant_1_id AND blocked_id = participant_2_id)
    OR (blocker_id = participant_2_id AND blocked_id = participant_1_id)
  )
);

-- ============================================
-- STEP 19: Create RLS policies for messages
-- ============================================

CREATE POLICY "Participants can view conversation messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  )
  AND is_deleted = false
);

CREATE POLICY "Participants can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conversation_id 
    AND (participant_1_id = auth.uid() OR participant_2_id = auth.uid())
  )
);

CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);

-- ============================================
-- STEP 20: Create RLS policies for doctor_reviews
-- ============================================

CREATE POLICY "Anyone can view verified doctor reviews"
ON public.doctor_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews"
ON public.doctor_reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
ON public.doctor_reviews FOR UPDATE
USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
ON public.doctor_reviews FOR DELETE
USING (auth.uid() = reviewer_id);

-- ============================================
-- STEP 21: Create RLS policies for blocks
-- ============================================

CREATE POLICY "Users can view their blocks"
ON public.blocks FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
ON public.blocks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their blocks"
ON public.blocks FOR DELETE
USING (auth.uid() = blocker_id);

-- ============================================
-- STEP 22: Create RLS policies for reports
-- ============================================

CREATE POLICY "Users can view their own reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  )
);

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND account_type = 'admin'
  )
);

-- ============================================
-- STEP 23: Create RLS policies for notifications
-- ============================================

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STEP 24: Create RLS policies for post_likes
-- ============================================

CREATE POLICY "Users can view post likes"
ON public.post_likes FOR SELECT
USING (true);

CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.post_likes FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- STEP 25: Create RLS policies for post_comments
-- ============================================

CREATE POLICY "Users can view comments on visible posts"
ON public.post_comments FOR SELECT
USING (
  is_deleted = false
  AND EXISTS (
    SELECT 1 FROM public.feed_posts 
    WHERE id = post_id AND is_deleted = false
  )
);

CREATE POLICY "Users can create comments"
ON public.post_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments FOR DELETE
USING (auth.uid() = author_id);

-- ============================================
-- STEP 26: Create trigger functions
-- ============================================

-- Function to create connection after request acceptance
CREATE OR REPLACE FUNCTION create_connection_on_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Create connection with consistent ordering
    INSERT INTO public.connections (user_id_1, user_id_2, connected_at)
    VALUES (
      LEAST(NEW.sender_id, NEW.receiver_id),
      GREATEST(NEW.sender_id, NEW.receiver_id),
      NOW()
    )
    ON CONFLICT (user_id_1, user_id_2) DO NOTHING;
    
    -- Create notification for sender
    INSERT INTO public.notifications (user_id, notification_type, title, message, data)
    VALUES (
      NEW.sender_id,
      'connection_accepted',
      'Connection Accepted',
      'Your connection request was accepted',
      jsonb_build_object('connection_id', NEW.id, 'user_id', NEW.receiver_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_create_connection ON public.connection_requests;
CREATE TRIGGER trigger_create_connection
AFTER UPDATE ON public.connection_requests
FOR EACH ROW
EXECUTE FUNCTION create_connection_on_accept();

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET last_message_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_conversation ON public.messages;
CREATE TRIGGER trigger_update_conversation
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_timestamp();

-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_post_like_insert ON public.post_likes;
CREATE TRIGGER trigger_post_like_insert
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

DROP TRIGGER IF EXISTS trigger_post_like_delete ON public.post_likes;
CREATE TRIGGER trigger_post_like_delete
AFTER DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts 
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_post_comment_count_insert ON public.post_comments;
CREATE TRIGGER trigger_post_comment_count_insert
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

DROP TRIGGER IF EXISTS trigger_post_comment_count_delete ON public.post_comments;
CREATE TRIGGER trigger_post_comment_count_delete
AFTER DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION update_post_comments_count();

-- Function to update doctor rating after review
CREATE OR REPLACE FUNCTION update_doctor_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(2,1);
  review_count INTEGER;
BEGIN
  SELECT AVG(rating), COUNT(*) 
  INTO avg_rating, review_count
  FROM public.doctor_reviews 
  WHERE doctor_id = NEW.doctor_id;
  
  UPDATE public.listeners 
  SET rating = avg_rating, reviews_count = review_count
  WHERE id = NEW.doctor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_doctor_rating ON public.doctor_reviews;
CREATE TRIGGER trigger_update_doctor_rating
AFTER INSERT OR UPDATE OR DELETE ON public.doctor_reviews
FOR EACH ROW
EXECUTE FUNCTION update_doctor_rating();

-- ============================================
-- STEP 27: Create storage buckets
-- ============================================

-- Insert chat-voice-messages bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-voice-messages', 'chat-voice-messages', false)
ON CONFLICT (id) DO NOTHING;

-- Insert doctor-verification bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('doctor-verification', 'doctor-verification', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 28: Create storage policies for chat voice messages
-- ============================================

DROP POLICY IF EXISTS "Authenticated users can upload chat voice messages" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat voice messages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-voice-messages');

DROP POLICY IF EXISTS "Participants can read chat voice messages" ON storage.objects;
CREATE POLICY "Participants can read chat voice messages"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-voice-messages'
  AND EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON m.conversation_id = c.id
    WHERE m.voice_url = name
    AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can delete their chat voice messages" ON storage.objects;
CREATE POLICY "Users can delete their chat voice messages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-voice-messages'
  AND EXISTS (
    SELECT 1 FROM public.messages 
    WHERE voice_url = name AND sender_id = auth.uid()
  )
);

-- ============================================
-- STEP 29: Create storage policies for doctor verification
-- ============================================

DROP POLICY IF EXISTS "Doctors can upload verification documents" ON storage.objects;
CREATE POLICY "Doctors can upload verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'doctor-verification'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND account_type IN ('doctor', 'listener')
  )
);

DROP POLICY IF EXISTS "Admins and owners can read verification documents" ON storage.objects;
CREATE POLICY "Admins and owners can read verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-verification'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND account_type = 'admin'
    )
    OR auth.uid()::text = (storage.foldername(name))[2]
  )
);

-- ============================================
-- STEP 30: Create helper functions for queries
-- ============================================

-- Function to check if users are connected
CREATE OR REPLACE FUNCTION are_users_connected(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.connections 
    WHERE (user_id_1 = LEAST(user1_id, user2_id) AND user_id_2 = GREATEST(user1_id, user2_id))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_user_id UUID, blocked_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocks 
    WHERE blocker_id = blocker_user_id AND blocked_id = blocked_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get connection status between two users
CREATE OR REPLACE FUNCTION get_connection_status(user1_id UUID, user2_id UUID)
RETURNS TEXT AS $$
DECLARE
  status TEXT;
BEGIN
  -- Check if connected
  IF are_users_connected(user1_id, user2_id) THEN
    RETURN 'connected';
  END IF;
  
  -- Check if pending request exists
  SELECT cr.status INTO status
  FROM public.connection_requests cr
  WHERE (sender_id = user1_id AND receiver_id = user2_id)
  OR (sender_id = user2_id AND receiver_id = user1_id)
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF status IS NOT NULL THEN
    RETURN status;
  END IF;
  
  RETURN 'none';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ Social & Chat System Migration Completed!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tables created:';
  RAISE NOTICE '   - connection_requests';
  RAISE NOTICE '   - connections';
  RAISE NOTICE '   - feed_posts';
  RAISE NOTICE '   - conversations';
  RAISE NOTICE '   - messages';
  RAISE NOTICE '   - doctor_reviews';
  RAISE NOTICE '   - blocks';
  RAISE NOTICE '   - reports';
  RAISE NOTICE '   - notifications';
  RAISE NOTICE '   - post_likes';
  RAISE NOTICE '   - post_comments';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Existing tables extended:';
  RAISE NOTICE '   - profiles (account_type, verification)';
  RAISE NOTICE '   - listeners (doctor fields)';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Row Level Security policies applied!';
  RAISE NOTICE '✅ Triggers created for automation!';
  RAISE NOTICE '✅ Indexes created for performance!';
  RAISE NOTICE '✅ Storage buckets configured!';
  RAISE NOTICE '✅ Helper functions created!';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your social connection & chat system is ready!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '   1. Enable Realtime for messages table';
  RAISE NOTICE '   2. Enable Realtime for notifications table';
  RAISE NOTICE '   3. Deploy your frontend code';
  RAISE NOTICE '   4. Test connection requests';
  RAISE NOTICE '   5. Test chat functionality';
  RAISE NOTICE '';
END $$;
