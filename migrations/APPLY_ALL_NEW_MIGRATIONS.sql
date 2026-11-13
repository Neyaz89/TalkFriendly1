-- ============================================================================
-- TalkFriendly: Apply All New Migrations (Phases 5-11)
-- ============================================================================
-- This script consolidates all new migrations in correct order
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set client encoding
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

BEGIN;

-- ============================================================================
-- MIGRATION 010: Listener Chat Actions (Phase 5)
-- ============================================================================

\echo '========================================='
\echo 'Applying Migration 010: Listener Chat Actions'
\echo '========================================='

-- Support Forms Table
CREATE TABLE IF NOT EXISTS public.support_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listener_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  submissions_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_forms_listener_id ON public.support_forms(listener_id);
CREATE INDEX IF NOT EXISTS idx_support_forms_is_active ON public.support_forms(is_active);

-- Form Submissions Table
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID REFERENCES public.support_forms(id) ON DELETE CASCADE NOT NULL,
  submitter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  responses JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'completed', 'cancelled')),
  review_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(form_id, submitter_id)
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitter_id ON public.form_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON public.form_submissions(status);

-- Feedback Requests Table
CREATE TABLE IF NOT EXISTS public.feedback_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listener_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  categories JSONB DEFAULT '["communication","helpfulness","professionalism","empathy"]'::jsonb,
  custom_questions JSONB DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  is_anonymous_allowed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listener_id, recipient_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_listener_id ON public.feedback_requests(listener_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_recipient_id ON public.feedback_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_expires_at ON public.feedback_requests(expires_at);

-- Feedback Responses Table
CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID REFERENCES public.feedback_requests(id) ON DELETE CASCADE NOT NULL UNIQUE,
  respondent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  category_ratings JSONB,
  custom_responses JSONB,
  comments TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_request_id ON public.feedback_responses(request_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_respondent_id ON public.feedback_responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_is_public ON public.feedback_responses(is_public);

-- RLS Policies for Migration 010
ALTER TABLE public.support_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

\echo 'Migration 010 tables created successfully'

-- ============================================================================
-- MIGRATION 011: Session Reviews (Phase 11)
-- ============================================================================

\echo '========================================='
\echo 'Applying Migration 011: Session Reviews'
\echo '========================================='

CREATE TABLE IF NOT EXISTS public.session_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  notes TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_reviews_appointment_id ON public.session_reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_session_reviews_admin_id ON public.session_reviews(admin_id);
CREATE INDEX IF NOT EXISTS idx_session_reviews_reviewed_at ON public.session_reviews(reviewed_at);

ALTER TABLE public.session_reviews ENABLE ROW LEVEL SECURITY;

\echo 'Migration 011 tables created successfully'

-- ============================================================================
-- Verification
-- ============================================================================

\echo '========================================='
\echo 'Verifying Migration Success'
\echo '========================================='

-- Count new tables
SELECT 
  'Tables created: ' || COUNT(*)::text as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'support_forms', 
    'form_submissions', 
    'feedback_requests', 
    'feedback_responses',
    'session_reviews'
  );

-- Count new indexes
SELECT 
  'Indexes created: ' || COUNT(*)::text as result
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN (
    'support_forms', 
    'form_submissions', 
    'feedback_requests', 
    'feedback_responses',
    'session_reviews'
  );

-- Verify RLS enabled
SELECT 
  'RLS enabled on: ' || COUNT(*)::text as result
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'support_forms', 
    'form_submissions', 
    'feedback_requests', 
    'feedback_responses',
    'session_reviews'
  )
  AND rowsecurity = true;

COMMIT;

\echo '========================================='
\echo 'All migrations applied successfully!'
\echo '========================================='
\echo 'Next steps:'
\echo '1. Verify application can connect'
\echo '2. Test new API endpoints'
\echo '3. Monitor for any errors'
\echo '========================================='
