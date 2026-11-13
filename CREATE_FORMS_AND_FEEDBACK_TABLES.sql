-- ============================================================================
-- Create Support Forms and Feedback System Tables
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Support Forms Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.support_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_support_forms_created_by ON public.support_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_support_forms_is_active ON public.support_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_support_forms_created_at ON public.support_forms(created_at);

-- Enable RLS
ALTER TABLE public.support_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_forms
-- Listeners can create, read, update, delete their own forms
CREATE POLICY "Listeners can manage their own forms"
  ON public.support_forms
  FOR ALL
  USING (
    created_by = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND account_type = 'listener'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND account_type = 'listener'
    )
  );

-- Users can read active forms that were sent to them (via form_submissions)
CREATE POLICY "Users can read forms sent to them"
  ON public.support_forms
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.form_submissions
      WHERE form_submissions.form_id = support_forms.id
      AND form_submissions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. Form Submissions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.support_forms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listener_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON public.form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON public.form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_listener_id ON public.form_submissions(listener_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_conversation_id ON public.form_submissions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_message_id ON public.form_submissions(message_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON public.form_submissions(submitted_at);

-- Enable RLS
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_submissions
-- Users can read and update their own submissions
CREATE POLICY "Users can manage their own form submissions"
  ON public.form_submissions
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Listeners can read submissions for their forms
CREATE POLICY "Listeners can read submissions for their forms"
  ON public.form_submissions
  FOR SELECT
  USING (
    listener_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.support_forms
      WHERE support_forms.id = form_submissions.form_id
      AND support_forms.created_by = auth.uid()
    )
  );

-- Listeners can create submissions when sending forms
CREATE POLICY "Listeners can create form submissions"
  ON public.form_submissions
  FOR INSERT
  WITH CHECK (
    listener_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND account_type = 'listener'
    )
  );

-- ============================================================================
-- 3. Feedback Requests Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  listener_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  categories JSONB DEFAULT '["Communication", "Helpfulness", "Professionalism"]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_feedback_requests_conversation_id ON public.feedback_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_listener_id ON public.feedback_requests(listener_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_user_id ON public.feedback_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_status ON public.feedback_requests(status);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_message_id ON public.feedback_requests(message_id);

-- Enable RLS
ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_requests
-- Users can read and update feedback requests sent to them
CREATE POLICY "Users can manage feedback requests sent to them"
  ON public.feedback_requests
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Listeners can create and read their feedback requests
CREATE POLICY "Listeners can manage their feedback requests"
  ON public.feedback_requests
  FOR ALL
  USING (
    listener_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND account_type = 'listener'
    )
  )
  WITH CHECK (
    listener_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND account_type = 'listener'
    )
  );

-- ============================================================================
-- 4. Feedback Responses Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_request_id UUID NOT NULL REFERENCES public.feedback_requests(id) ON DELETE CASCADE,
  listener_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  category_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  comment TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback_request_id ON public.feedback_responses(feedback_request_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_listener_id ON public.feedback_responses(listener_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_user_id ON public.feedback_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_overall_rating ON public.feedback_responses(overall_rating);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_is_public ON public.feedback_responses(is_public);

-- Enable RLS
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_responses
-- Users can create and read their own feedback responses
CREATE POLICY "Users can manage their own feedback responses"
  ON public.feedback_responses
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Listeners can read public feedback responses about them
CREATE POLICY "Listeners can read public feedback about them"
  ON public.feedback_responses
  FOR SELECT
  USING (
    listener_id = auth.uid()
    AND is_public = true
  );

-- Admins can read all feedback
CREATE POLICY "Admins can read all feedback"
  ON public.feedback_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND account_type = 'admin'
    )
  );

-- ============================================================================
-- 5. Update Triggers
-- ============================================================================

-- Trigger to update updated_at timestamp for support_forms
CREATE OR REPLACE FUNCTION update_support_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_support_forms_updated_at
  BEFORE UPDATE ON public.support_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_support_forms_updated_at();

-- Trigger to update updated_at timestamp for form_submissions
CREATE OR REPLACE FUNCTION update_form_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_form_submissions_updated_at
  BEFORE UPDATE ON public.form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_form_submissions_updated_at();

-- Trigger to update updated_at timestamp for feedback_requests
CREATE OR REPLACE FUNCTION update_feedback_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_requests_updated_at
  BEFORE UPDATE ON public.feedback_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_requests_updated_at();

-- Trigger to update updated_at timestamp for feedback_responses
CREATE OR REPLACE FUNCTION update_feedback_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feedback_responses_updated_at
  BEFORE UPDATE ON public.feedback_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_responses_updated_at();

-- ============================================================================
-- 6. Comments
-- ============================================================================

COMMENT ON TABLE public.support_forms IS 'Support forms created by listeners to gather information from users';
COMMENT ON TABLE public.form_submissions IS 'User submissions of support forms';
COMMENT ON TABLE public.feedback_requests IS 'Feedback requests sent by listeners to users';
COMMENT ON TABLE public.feedback_responses IS 'User feedback responses about listeners';

-- ============================================================================
-- Done!
-- ============================================================================

SELECT 'Forms and Feedback tables created successfully!' as status;
