-- ============================================================================
-- Migration: 011 - Session Reviews Table
-- Description: Add table for admin session reviews and notes
-- Date: 2026-11-13
-- ============================================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SESSION REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.session_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  
  -- Review details
  notes TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_session_reviews_appointment_id 
  ON public.session_reviews(appointment_id);

CREATE INDEX IF NOT EXISTS idx_session_reviews_admin_id 
  ON public.session_reviews(admin_id);

CREATE INDEX IF NOT EXISTS idx_session_reviews_reviewed_at 
  ON public.session_reviews(reviewed_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.session_reviews ENABLE ROW LEVEL SECURITY;

-- Admin can view all session reviews
CREATE POLICY "Admin can view all session reviews" 
  ON public.session_reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Admin can insert session reviews
CREATE POLICY "Admin can insert session reviews" 
  ON public.session_reviews FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Admin can update session reviews
CREATE POLICY "Admin can update session reviews" 
  ON public.session_reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_session_reviews_updated_at
  BEFORE UPDATE ON public.session_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_session_reviews_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.session_reviews IS 'Admin reviews and notes for session attendance';
COMMENT ON COLUMN public.session_reviews.appointment_id IS 'Reference to the reviewed appointment (unique)';
COMMENT ON COLUMN public.session_reviews.admin_id IS 'Admin who reviewed the session';
COMMENT ON COLUMN public.session_reviews.notes IS 'Admin notes about the session (adjustments, anomalies, etc.)';
COMMENT ON COLUMN public.session_reviews.reviewed_at IS 'When the session was reviewed';

-- ============================================================================
-- VERIFY INSTALLATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Session reviews table created successfully';
  RAISE NOTICE 'Indexes created';
  RAISE NOTICE 'RLS policies enabled';
  RAISE NOTICE 'Triggers configured';
END $$;

-- Display table info
SELECT 
    schemaname, 
    tablename, 
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'session_reviews';
