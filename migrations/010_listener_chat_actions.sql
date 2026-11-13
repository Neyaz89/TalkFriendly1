-- Migration 010: Listener Chat Actions (Support Forms & Feedback Requests)
-- Adds support for listener-only chat actions including internal forms and feedback system

-- ============================================================================
-- PART 1: Extend message_type enum
-- ============================================================================

-- Add new message types: 'support_form_request' and 'feedback_request'
-- Note: PostgreSQL doesn't allow direct ALTER TYPE ADD VALUE in transactions
-- This must be run separately if in a transaction block

DO $$
BEGIN
    -- Check if the new values already exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'support_form_request' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'message_type')
    ) THEN
        ALTER TYPE message_type ADD VALUE 'support_form_request';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'feedback_request' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'message_type')
    ) THEN
        ALTER TYPE message_type ADD VALUE 'feedback_request';
    END IF;
END$$;

-- ============================================================================
-- PART 2: Support Forms System
-- ============================================================================

-- Support Forms Table
-- Stores form templates created by listeners
CREATE TABLE IF NOT EXISTS support_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of FormField objects
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT forms_created_by_listener CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = created_by 
            AND profiles.account_type = 'listener'
        )
    )
);

-- Form Submissions Table
-- Stores user responses to forms
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES support_forms(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    responses JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of FormFieldResponse objects
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'completed', 'cancelled')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 3: Feedback System
-- ============================================================================

-- Feedback Requests Table
-- Tracks feedback requests sent by listeners
CREATE TABLE IF NOT EXISTS feedback_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- Set after message creation
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    session_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_from UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    categories TEXT[] NOT NULL DEFAULT ARRAY['communication', 'helpfulness', 'professionalism', 'empathy'],
    custom_questions TEXT[],
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'expired')),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT feedback_requested_by_listener CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = requested_by 
            AND profiles.account_type = 'listener'
        )
    )
);

-- Feedback Responses Table
-- Stores feedback provided by users
CREATE TABLE IF NOT EXISTS feedback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_request_id UUID NOT NULL REFERENCES feedback_requests(id) ON DELETE CASCADE,
    session_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    listener_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    category_ratings JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of RatingCategory objects
    custom_responses JSONB, -- Array of {question, answer} objects
    comment TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT feedback_user_is_user CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = user_id 
            AND profiles.account_type = 'user'
        )
    ),
    CONSTRAINT feedback_listener_is_listener CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = listener_id 
            AND profiles.account_type = 'listener'
        )
    )
);

-- ============================================================================
-- PART 4: Indexes
-- ============================================================================

-- Support Forms Indexes
CREATE INDEX IF NOT EXISTS idx_support_forms_created_by ON support_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_support_forms_created_at ON support_forms(created_at DESC);

-- Form Submissions Indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_message_id ON form_submissions(message_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_conversation_id ON form_submissions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at DESC);

-- Feedback Requests Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_requests_message_id ON feedback_requests(message_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_conversation_id ON feedback_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_session_id ON feedback_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_requested_by ON feedback_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_requested_from ON feedback_requests(requested_from);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_status ON feedback_requests(status);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_expires_at ON feedback_requests(expires_at);

-- Feedback Responses Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_responses_request_id ON feedback_responses(feedback_request_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_session_id ON feedback_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_listener_id ON feedback_responses(listener_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_user_id ON feedback_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_is_public ON feedback_responses(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_feedback_responses_created_at ON feedback_responses(created_at DESC);

-- ============================================================================
-- PART 5: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE support_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;

-- Support Forms Policies
-- Listeners can manage their own forms
CREATE POLICY support_forms_select ON support_forms
    FOR SELECT USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM form_submissions fs
            WHERE fs.form_id = support_forms.id
            AND fs.submitted_by = auth.uid()
        )
    );

CREATE POLICY support_forms_insert ON support_forms
    FOR INSERT WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND account_type = 'listener'
        )
    );

CREATE POLICY support_forms_update ON support_forms
    FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY support_forms_delete ON support_forms
    FOR DELETE USING (created_by = auth.uid());

-- Form Submissions Policies
-- Users can view/create their own submissions, listeners can view submissions to their forms
CREATE POLICY form_submissions_select ON form_submissions
    FOR SELECT USING (
        submitted_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM support_forms sf
            WHERE sf.id = form_submissions.form_id
            AND sf.created_by = auth.uid()
        )
    );

CREATE POLICY form_submissions_insert ON form_submissions
    FOR INSERT WITH CHECK (submitted_by = auth.uid());

CREATE POLICY form_submissions_update ON form_submissions
    FOR UPDATE USING (
        submitted_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM support_forms sf
            WHERE sf.id = form_submissions.form_id
            AND sf.created_by = auth.uid()
        )
    );

-- Feedback Requests Policies
-- Both parties in the conversation can view feedback requests
CREATE POLICY feedback_requests_select ON feedback_requests
    FOR SELECT USING (
        requested_by = auth.uid()
        OR requested_from = auth.uid()
    );

CREATE POLICY feedback_requests_insert ON feedback_requests
    FOR INSERT WITH CHECK (
        requested_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND account_type = 'listener'
        )
    );

CREATE POLICY feedback_requests_update ON feedback_requests
    FOR UPDATE USING (
        requested_by = auth.uid()
        OR requested_from = auth.uid()
    );

-- Feedback Responses Policies
-- Users can create/view their own responses, listeners can view responses about them
CREATE POLICY feedback_responses_select ON feedback_responses
    FOR SELECT USING (
        user_id = auth.uid()
        OR listener_id = auth.uid()
        OR (is_public = true AND is_anonymous = false)
    );

CREATE POLICY feedback_responses_insert ON feedback_responses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY feedback_responses_update ON feedback_responses
    FOR UPDATE USING (user_id = auth.uid() OR listener_id = auth.uid());

-- ============================================================================
-- PART 6: Triggers
-- ============================================================================

-- Update timestamp trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_support_forms_updated_at
    BEFORE UPDATE ON support_forms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_submissions_updated_at
    BEFORE UPDATE ON form_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_requests_updated_at
    BEFORE UPDATE ON feedback_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_responses_updated_at
    BEFORE UPDATE ON feedback_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 7: Auto-expire feedback requests
-- ============================================================================

-- Trigger to automatically mark expired feedback requests
CREATE OR REPLACE FUNCTION auto_expire_feedback_requests()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() AND NEW.status = 'pending' THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_feedback_request_expiry
    BEFORE UPDATE ON feedback_requests
    FOR EACH ROW EXECUTE FUNCTION auto_expire_feedback_requests();

-- ============================================================================
-- PART 8: Update notification types
-- ============================================================================

-- Add new notification types to notifications table (if type constraint exists)
-- This assumes notifications.type has a check constraint

COMMENT ON COLUMN notifications.type IS 'Valid types: connection_request, connection_accepted, support_form_request, feedback_request, appointment_created, appointment_cancelled, message_received';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verification queries (comment out for production)
-- SELECT * FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'message_type');
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('support_forms', 'form_submissions', 'feedback_requests', 'feedback_responses');
