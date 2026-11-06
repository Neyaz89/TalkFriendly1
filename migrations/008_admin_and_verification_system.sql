-- ============================================================================
-- TalkFriendly Admin & Verification System - Database Schema
-- Migration: 008
-- Date: November 6, 2026
-- Description: Adds role-based registration, Listener application workflow,
--              admin authentication, permissions, and comprehensive audit logging
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. LISTENER APPLICATIONS (Comprehensive Application Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.listener_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Personal Information
  full_legal_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  state_province TEXT,
  
  -- Professional Information
  professional_title TEXT NOT NULL,
  qualifications TEXT[] NOT NULL,
  educational_institution TEXT NOT NULL,
  specialization TEXT[] NOT NULL,
  years_of_experience INTEGER NOT NULL CHECK (years_of_experience >= 0),
  professional_bio TEXT NOT NULL,
  languages_spoken TEXT[] NOT NULL,
  areas_of_expertise TEXT[] NOT NULL,
  
  -- Verification Details
  license_number TEXT,
  licensing_authority TEXT,
  license_country TEXT,
  license_state_province TEXT,
  license_expiry_date DATE,
  
  -- Documents (stored in verification-documents bucket)
  profile_photo_url TEXT,
  verification_documents JSONB NOT NULL DEFAULT '[]',
  -- Expected structure: [{"type": "license", "url": "...", "name": "...", "uploaded_at": "..."}]
  
  -- Application Status
  status TEXT NOT NULL DEFAULT 'pending_review' CHECK (
    status IN (
      'draft',
      'pending_review',
      'under_review',
      'additional_info_required',
      'approved',
      'rejected',
      'withdrawn'
    )
  ),
  
  -- Review Process
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT,
  additional_info_requested TEXT,
  admin_internal_notes TEXT, -- Private admin notes
  
  -- Resubmission
  is_resubmission BOOLEAN DEFAULT FALSE,
  original_application_id UUID REFERENCES public.listener_applications(id) ON DELETE SET NULL,
  resubmission_count INTEGER DEFAULT 0,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_status_transitions CHECK (
    (status = 'approved' AND approved_at IS NOT NULL) OR
    (status = 'rejected' AND rejected_at IS NOT NULL) OR
    (status NOT IN ('approved', 'rejected'))
  )
);

-- Indexes
CREATE INDEX idx_listener_applications_user_id ON public.listener_applications(user_id);
CREATE INDEX idx_listener_applications_status ON public.listener_applications(status);
CREATE INDEX idx_listener_applications_submitted_at ON public.listener_applications(submitted_at DESC);
CREATE INDEX idx_listener_applications_reviewed_by ON public.listener_applications(reviewed_by);

-- RLS Policies (without admin_permissions dependency - will be added later)
ALTER TABLE public.listener_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications" 
  ON public.listener_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" 
  ON public.listener_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft applications" 
  ON public.listener_applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Admins can view all applications" 
  ON public.listener_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Note: Admin update policy will be added after admin_permissions table is created

-- ============================================================================
-- 2. APPLICATION STATUS HISTORY (Track all status changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES public.listener_applications(id) ON DELETE CASCADE NOT NULL,
  
  -- Status Change
  from_status TEXT,
  to_status TEXT NOT NULL,
  
  -- Actor
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  change_reason TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_application_status_history_application_id ON public.application_status_history(application_id);
CREATE INDEX idx_application_status_history_created_at ON public.application_status_history(created_at DESC);

-- RLS Policies
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application history" 
  ON public.application_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listener_applications 
      WHERE listener_applications.id = application_status_history.application_id 
      AND listener_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all history" 
  ON public.application_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- ============================================================================
-- 3. ADMIN ROLES (Granular admin permission system)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Role Definition
  role_name TEXT UNIQUE NOT NULL,
  role_description TEXT,
  
  -- Permission Level
  permission_level INTEGER NOT NULL CHECK (permission_level >= 1 AND permission_level <= 100),
  -- 100 = Super Admin, 80 = Admin, 60 = Manager, 40 = Moderator, 20 = Viewer
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_system_role BOOLEAN DEFAULT FALSE, -- Cannot be deleted if true
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default roles
INSERT INTO public.admin_roles (role_name, role_description, permission_level, is_system_role) VALUES
  ('super_admin', 'Full administrative access to all platform features', 100, TRUE),
  ('admin', 'General administrative access to platform operations', 80, TRUE),
  ('verification_manager', 'Manages Listener application review and verification', 60, TRUE),
  ('finance_manager', 'Manages financial operations, payouts, and reporting', 60, TRUE),
  ('moderation_manager', 'Manages content moderation and user reports', 60, TRUE),
  ('support_manager', 'Manages user support and dispute resolution', 40, TRUE),
  ('analytics_viewer', 'Read-only access to analytics and reports', 20, TRUE)
ON CONFLICT (role_name) DO NOTHING;

-- Indexes
CREATE INDEX idx_admin_roles_role_name ON public.admin_roles(role_name);
CREATE INDEX idx_admin_roles_permission_level ON public.admin_roles(permission_level DESC);

-- RLS Policies
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view roles" 
  ON public.admin_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Note: Super admin modification policy will be added after admin_permissions table is created

-- ============================================================================
-- 4. ADMIN PERMISSIONS (User-specific permissions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Permission Assignment
  permission TEXT NOT NULL CHECK (
    permission IN (
      'super_admin',
      'manage_users',
      'manage_listeners',
      'review_applications',
      'manage_appointments',
      'manage_financials',
      'execute_payouts',
      'manage_refunds',
      'view_analytics',
      'manage_moderation',
      'manage_reports',
      'manage_platform_settings',
      'view_audit_logs',
      'manage_admins'
    )
  ),
  
  -- Scope (optional restrictions)
  scope_restrictions JSONB,
  -- Example: {"countries": ["US", "UK"], "max_amount": 10000}
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Assignment tracking
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  
  -- Expiry (optional)
  expires_at TIMESTAMPTZ,
  
  -- Reason
  grant_reason TEXT,
  revoke_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, permission)
);

-- Indexes
CREATE INDEX idx_admin_permissions_user_id ON public.admin_permissions(user_id);
CREATE INDEX idx_admin_permissions_permission ON public.admin_permissions(permission);
CREATE INDEX idx_admin_permissions_is_active ON public.admin_permissions(is_active);
CREATE INDEX idx_admin_permissions_granted_by ON public.admin_permissions(granted_by);

-- RLS Policies
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own permissions" 
  ON public.admin_permissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all permissions" 
  ON public.admin_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

CREATE POLICY "Only super admins can grant permissions" 
  ON public.admin_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.account_type = 'admin'
      AND ap.user_id = auth.uid()
      AND ap.permission = 'super_admin'
      AND ap.is_active = TRUE
    )
  );

CREATE POLICY "Only super admins can revoke permissions" 
  ON public.admin_permissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.account_type = 'admin'
      AND ap.user_id = auth.uid()
      AND ap.permission = 'super_admin'
      AND ap.is_active = TRUE
    )
  );

-- ============================================================================
-- 5. ADMIN ACTIVITY LOG (Comprehensive audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Actor
  admin_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  admin_username TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  
  -- Action
  action_type TEXT NOT NULL CHECK (
    action_type IN (
      'login', 'logout', 'login_failed',
      'user_viewed', 'user_suspended', 'user_activated', 'user_deleted',
      'listener_viewed', 'listener_approved', 'listener_rejected', 'listener_suspended', 'listener_reactivated',
      'application_reviewed', 'application_approved', 'application_rejected', 'additional_info_requested',
      'appointment_viewed', 'appointment_cancelled', 'appointment_modified',
      'financial_viewed', 'payout_executed', 'refund_processed', 'commission_adjusted',
      'report_reviewed', 'report_resolved', 'user_blocked', 'content_removed',
      'permission_granted', 'permission_revoked', 'admin_created', 'admin_deleted',
      'setting_changed', 'config_updated',
      'document_accessed', 'sensitive_data_accessed'
    )
  ),
  
  -- Target
  target_type TEXT CHECK (
    target_type IN (
      'user', 'listener', 'application', 'appointment', 
      'financial_record', 'report', 'admin', 'setting', 'document'
    )
  ),
  target_id TEXT,
  target_identifier TEXT, -- Human-readable identifier (email, name, etc.)
  
  -- Details
  action_description TEXT NOT NULL,
  changes_made JSONB, -- Before/after values
  reason TEXT,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  request_id TEXT,
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_admin_activity_log_admin_user_id ON public.admin_activity_log(admin_user_id);
CREATE INDEX idx_admin_activity_log_action_type ON public.admin_activity_log(action_type);
CREATE INDEX idx_admin_activity_log_target_type ON public.admin_activity_log(target_type);
CREATE INDEX idx_admin_activity_log_target_id ON public.admin_activity_log(target_id);
CREATE INDEX idx_admin_activity_log_created_at ON public.admin_activity_log(created_at DESC);

-- RLS Policies
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins with view_audit_logs permission can view logs" 
  ON public.admin_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.account_type = 'admin'
      AND ap.user_id = auth.uid()
      AND ap.permission IN ('view_audit_logs', 'super_admin')
      AND ap.is_active = TRUE
    )
  );

-- Prevent deletion (immutable audit trail)
CREATE POLICY "Audit logs cannot be deleted" 
  ON public.admin_activity_log FOR DELETE
  USING (FALSE);

-- ============================================================================
-- 6. ADMIN SESSIONS (Track admin login sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Session info
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT,
  
  -- MFA
  mfa_verified BOOLEAN DEFAULT FALSE,
  mfa_verified_at TIMESTAMPTZ,
  
  -- Device info
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoke_reason TEXT
);

-- Indexes
CREATE INDEX idx_admin_sessions_user_id ON public.admin_sessions(user_id);
CREATE INDEX idx_admin_sessions_session_token ON public.admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_is_active ON public.admin_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_admin_sessions_expires_at ON public.admin_sessions(expires_at);

-- RLS Policies
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" 
  ON public.admin_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all sessions" 
  ON public.admin_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.account_type = 'admin'
      AND ap.user_id = auth.uid()
      AND ap.permission = 'super_admin'
      AND ap.is_active = TRUE
    )
  );

-- ============================================================================
-- 7. PLATFORM ANALYTICS CACHE (Pre-computed metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Metric identity
  metric_type TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metric data
  metric_data JSONB NOT NULL,
  
  -- Cache info
  computed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  
  UNIQUE(metric_type, period_type, period_start, period_end)
);

-- Indexes
CREATE INDEX idx_analytics_cache_metric_type ON public.platform_analytics_cache(metric_type);
CREATE INDEX idx_analytics_cache_period ON public.platform_analytics_cache(period_type, period_start, period_end);
CREATE INDEX idx_analytics_cache_expires_at ON public.platform_analytics_cache(expires_at);

-- RLS Policies
ALTER TABLE public.platform_analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins with view_analytics can view cache" 
  ON public.platform_analytics_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.account_type = 'admin'
      AND ap.user_id = auth.uid()
      AND ap.permission IN ('view_analytics', 'super_admin')
      AND ap.is_active = TRUE
    )
  );

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_listener_applications_updated_at 
  BEFORE UPDATE ON public.listener_applications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_admin_roles_updated_at 
  BEFORE UPDATE ON public.admin_roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_admin_permissions_updated_at 
  BEFORE UPDATE ON public.admin_permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-log application status changes
CREATE OR REPLACE FUNCTION log_application_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.application_status_history (
            application_id,
            from_status,
            to_status,
            changed_by,
            change_reason,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.reviewed_by, auth.uid()),
            NEW.review_notes,
            jsonb_build_object(
                'review_notes', NEW.review_notes,
                'rejection_reason', NEW.rejection_reason,
                'additional_info_requested', NEW.additional_info_requested
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_application_status_change 
  AFTER UPDATE ON public.listener_applications 
  FOR EACH ROW EXECUTE FUNCTION log_application_status_change();

-- Update listener profile when application is approved
CREATE OR REPLACE FUNCTION sync_listener_profile_on_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status = 'approved' AND OLD.status != 'approved') THEN
        -- Update or create listener profile
        INSERT INTO public.listeners (
            user_id,
            name,
            professional_title,
            qualifications,
            specialization,
            years_of_experience,
            bio,
            languages,
            license_number,
            verification_status,
            verified_at,
            verified_by,
            avatar_url,
            specialties
        ) VALUES (
            NEW.user_id,
            NEW.full_legal_name,
            NEW.professional_title,
            NEW.qualifications,
            NEW.specialization,
            NEW.years_of_experience,
            NEW.professional_bio,
            NEW.languages_spoken,
            NEW.license_number,
            'verified',
            NOW(),
            NEW.reviewed_by,
            NEW.profile_photo_url,
            NEW.areas_of_expertise
        )
        ON CONFLICT (user_id) DO UPDATE SET
            name = EXCLUDED.name,
            professional_title = EXCLUDED.professional_title,
            qualifications = EXCLUDED.qualifications,
            specialization = EXCLUDED.specialization,
            years_of_experience = EXCLUDED.years_of_experience,
            bio = EXCLUDED.bio,
            languages = EXCLUDED.languages,
            license_number = EXCLUDED.license_number,
            verification_status = 'verified',
            verified_at = NOW(),
            verified_by = EXCLUDED.verified_by,
            updated_at = NOW();
        
        -- Update profile account_type
        UPDATE public.profiles
        SET 
            account_type = 'listener',
            is_verified = TRUE,
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_sync_listener_profile_on_approval 
  AFTER UPDATE ON public.listener_applications 
  FOR EACH ROW EXECUTE FUNCTION sync_listener_profile_on_approval();

-- Update last_activity_at on admin sessions
CREATE OR REPLACE FUNCTION update_admin_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_session_activity 
  BEFORE UPDATE ON public.admin_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_admin_session_activity();

-- ============================================================================
-- 9. FUNCTIONS
-- ============================================================================

-- Function to check if user has admin permission
CREATE OR REPLACE FUNCTION has_admin_permission(
    p_user_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    -- Check if user is admin and has the specific permission
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles p
        JOIN public.admin_permissions ap ON ap.user_id = p.id
        WHERE p.id = p_user_id
        AND p.account_type = 'admin'
        AND p.is_active = TRUE
        AND ap.permission IN (p_permission, 'super_admin')
        AND ap.is_active = TRUE
        AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_admin_user_id UUID,
    p_action_type TEXT,
    p_action_description TEXT,
    p_target_type TEXT DEFAULT NULL,
    p_target_id TEXT DEFAULT NULL,
    p_target_identifier TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_changes_made JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_username TEXT;
    v_email TEXT;
BEGIN
    -- Get admin details
    SELECT username, email INTO v_username, v_email
    FROM public.profiles
    WHERE id = p_admin_user_id;
    
    -- Insert log entry
    INSERT INTO public.admin_activity_log (
        admin_user_id,
        admin_username,
        admin_email,
        action_type,
        action_description,
        target_type,
        target_id,
        target_identifier,
        reason,
        changes_made,
        metadata
    ) VALUES (
        p_admin_user_id,
        v_username,
        v_email,
        p_action_type,
        p_action_description,
        p_target_type,
        p_target_id,
        p_target_identifier,
        p_reason,
        p_changes_made,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending listener applications count
CREATE OR REPLACE FUNCTION get_pending_applications_count()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.listener_applications
    WHERE status IN ('pending_review', 'under_review');
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke all admin sessions for a user
CREATE OR REPLACE FUNCTION revoke_all_admin_sessions(
    p_user_id UUID,
    p_revoked_by UUID,
    p_reason TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.admin_sessions
    SET 
        is_active = FALSE,
        revoked_at = NOW(),
        revoked_by = p_revoked_by,
        revoke_reason = p_reason
    WHERE user_id = p_user_id
    AND is_active = TRUE;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. DATA MIGRATION (Existing listeners)
-- ============================================================================

-- Mark all existing verified listeners as approved
-- This ensures backward compatibility
DO $$
BEGIN
    -- Update existing listeners to verified status if not already set
    UPDATE public.listeners
    SET 
        verification_status = 'verified',
        verified_at = COALESCE(verified_at, created_at)
    WHERE verification_status IS NULL 
    OR verification_status = 'pending';
    
    RAISE NOTICE 'Migrated % existing listeners to verified status', 
        (SELECT COUNT(*) FROM public.listeners WHERE verification_status = 'verified');
END $$;

-- ============================================================================
-- 10. STORAGE BUCKET SETUP (For verification documents)
-- ============================================================================

-- Note: Run this in Supabase Dashboard Storage section or via API:
-- 
-- CREATE BUCKET verification-documents WITH (
--   public = false,
--   file_size_limit = 10485760, -- 10MB
--   allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
-- );
--
-- RLS Policies for verification-documents bucket:
-- 1. Applicants can upload to their own folder
-- 2. Admins with review_applications permission can view all
-- 3. No public access

-- ============================================================================
-- 11. ADD PERMISSION-BASED RLS POLICIES (After all tables created)
-- ============================================================================

-- Now that admin_permissions table exists, add the permission-based policies

-- Listener applications - admin update policy
CREATE POLICY "Admins with permission can update applications" 
  ON public.listener_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.account_type = 'admin'
      AND ap.user_id = auth.uid()
      AND ap.permission IN ('manage_listeners', 'review_applications', 'super_admin')
      AND ap.is_active = TRUE
    )
  );

-- Admin roles - super admin modification policy
CREATE POLICY "Only super admins can modify roles" 
  ON public.admin_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.account_type = 'admin'
      AND ap.user_id = auth.uid()
      AND ap.permission = 'super_admin'
      AND ap.is_active = TRUE
    )
  );

-- ============================================================================
-- 12. COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.listener_applications IS 'Comprehensive Listener application submissions with verification workflow';
COMMENT ON TABLE public.application_status_history IS 'Audit trail of all application status changes';
COMMENT ON TABLE public.admin_roles IS 'Predefined admin role templates';
COMMENT ON TABLE public.admin_permissions IS 'User-specific admin permissions with expiry and scope';
COMMENT ON TABLE public.admin_activity_log IS 'Immutable audit trail of all admin actions';
COMMENT ON TABLE public.admin_sessions IS 'Active admin login sessions with MFA tracking';
COMMENT ON TABLE public.platform_analytics_cache IS 'Pre-computed analytics for performance';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification query
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'listener_applications',
        'application_status_history',
        'admin_roles',
        'admin_permissions',
        'admin_activity_log',
        'admin_sessions',
        'platform_analytics_cache'
    );
    
    RAISE NOTICE 'Migration 008 complete. Created % new tables for admin system.', table_count;
    RAISE NOTICE 'Existing listeners preserved. New role-based registration ready.';
    RAISE NOTICE 'Run storage bucket setup commands in Supabase Dashboard.';
END $$;
