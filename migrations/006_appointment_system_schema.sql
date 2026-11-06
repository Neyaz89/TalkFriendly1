-- ============================================================================
-- TalkFriendly Appointment & Video Consultation System - Database Schema
-- Migration: 006
-- Date: November 4, 2026
-- Description: Adds comprehensive appointment scheduling, Google Meet 
--              integration, attendance tracking, and financial management
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- For exclusion constraints

-- ============================================================================
-- 1. PSYCHIATRIST AVAILABILITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.psychiatrist_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  psychiatrist_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Day of Week (0-6, Sunday-Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Time Range (stored in psychiatrist's local time)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Timezone
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Index for availability queries
CREATE INDEX idx_psychiatrist_availability_psychiatrist ON public.psychiatrist_availability(psychiatrist_id) WHERE is_active = TRUE;
CREATE INDEX idx_psychiatrist_availability_day ON public.psychiatrist_availability(day_of_week);

-- RLS Policies
ALTER TABLE public.psychiatrist_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view psychiatrist availability" 
  ON public.psychiatrist_availability FOR SELECT 
  USING (is_active = TRUE);

CREATE POLICY "Psychiatrists can manage own availability" 
  ON public.psychiatrist_availability FOR ALL 
  USING (auth.uid() = psychiatrist_id)
  WITH CHECK (auth.uid() = psychiatrist_id);

-- ============================================================================
-- 2. APPOINTMENTS (Core booking table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Participants
  patient_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  psychiatrist_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  doctor_profile_id UUID REFERENCES public.listeners(id) ON DELETE RESTRICT NOT NULL,
  
  -- Scheduling
  scheduled_start_time TIMESTAMPTZ NOT NULL,
  scheduled_end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (15, 30, 60)),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  -- Session Type
  booking_type TEXT NOT NULL CHECK (booking_type IN ('immediate', 'scheduled')),
  
  -- Google Meet
  google_meet_space_name TEXT,
  google_meet_uri TEXT,
  google_conference_id TEXT,
  
  -- Pricing Snapshot (immutable after booking)
  price_snapshot JSONB NOT NULL,
  -- Expected structure: { "amount": 60.00, "currency": "USD", "commission_rate": 0.20, "duration_minutes": 60 }
  
  -- Status Management
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
    status IN (
      'pending_payment', 'confirmed', 'scheduled', 'ready', 'in_progress',
      'interrupted', 'completed', 'cancelled', 'no_show', 'attendance_pending', 'disputed'
    )
  ),
  
  -- Payment
  payment_transaction_id TEXT UNIQUE,
  payment_status TEXT DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded')
  ),
  
  -- Timestamps
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Metadata
  patient_notes TEXT,
  internal_notes TEXT,
  
  -- Prevent overlapping appointments for psychiatrist
  CONSTRAINT no_overlapping_psychiatrist EXCLUDE USING gist (
    psychiatrist_id WITH =,
    tstzrange(scheduled_start_time, scheduled_end_time) WITH &&
  ) WHERE (status NOT IN ('cancelled', 'completed'))
);

-- Indexes for appointments
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_psychiatrist_id ON public.appointments(psychiatrist_id);
CREATE INDEX idx_appointments_doctor_profile_id ON public.appointments(doctor_profile_id);
CREATE INDEX idx_appointments_scheduled_start ON public.appointments(scheduled_start_time);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_payment_status ON public.appointments(payment_status);
CREATE INDEX idx_appointments_created_at ON public.appointments(created_at DESC);
CREATE INDEX idx_appointments_booking_type ON public.appointments(booking_type);

-- Composite index for querying upcoming appointments
CREATE INDEX idx_appointments_user_upcoming ON public.appointments(patient_id, scheduled_start_time) 
  WHERE status NOT IN ('cancelled', 'completed');
CREATE INDEX idx_appointments_psychiatrist_upcoming ON public.appointments(psychiatrist_id, scheduled_start_time) 
  WHERE status NOT IN ('cancelled', 'completed');

-- RLS Policies
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" 
  ON public.appointments FOR SELECT
  USING (auth.uid() = patient_id OR auth.uid() = psychiatrist_id);

CREATE POLICY "Patients can create appointments" 
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Participants can update own appointments" 
  ON public.appointments FOR UPDATE
  USING (auth.uid() = patient_id OR auth.uid() = psychiatrist_id);

-- ============================================================================
-- 3. GOOGLE MEET CONFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.google_meet_conferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Google Meet Identifiers
  space_name TEXT NOT NULL, -- spaces/SPACE_ID
  meeting_uri TEXT NOT NULL,
  meeting_code TEXT,
  conference_record_name TEXT, -- conferenceRecords/RECORD_ID (after meeting ends)
  
  -- Conference State
  conference_state TEXT DEFAULT 'created' CHECK (
    conference_state IN ('created', 'active', 'ended', 'reconciled')
  ),
  
  -- Timestamps from Google
  google_start_time TIMESTAMPTZ,
  google_end_time TIMESTAMPTZ,
  
  -- Reconciliation
  reconciliation_status TEXT DEFAULT 'pending' CHECK (
    reconciliation_status IN ('pending', 'in_progress', 'completed', 'failed', 'manual_review_required')
  ),
  reconciliation_attempted_at TIMESTAMPTZ,
  reconciliation_completed_at TIMESTAMPTZ,
  reconciliation_error TEXT,
  reconciliation_attempts INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_google_meet_appointment_id ON public.google_meet_conferences(appointment_id);
CREATE INDEX idx_google_meet_conference_state ON public.google_meet_conferences(conference_state);
CREATE INDEX idx_google_meet_reconciliation_status ON public.google_meet_conferences(reconciliation_status);
CREATE INDEX idx_google_meet_space_name ON public.google_meet_conferences(space_name);

-- RLS Policies
ALTER TABLE public.google_meet_conferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conference details" 
  ON public.google_meet_conferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.id = google_meet_conferences.appointment_id 
      AND (appointments.patient_id = auth.uid() OR appointments.psychiatrist_id = auth.uid())
    )
  );

-- ============================================================================
-- 4. ATTENDANCE EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.attendance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  
  -- Event Identity (for deduplication)
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('conference_started', 'conference_ended', 'participant_joined', 'participant_left')
  ),
  event_timestamp TIMESTAMPTZ NOT NULL,
  
  -- Participant Information
  google_participant_id TEXT,
  participant_display_name TEXT,
  participant_email TEXT,
  
  -- Mapping to TalkFriendly Users
  mapped_user_id UUID REFERENCES public.profiles(id),
  mapping_confidence TEXT DEFAULT 'unknown' CHECK (
    mapping_confidence IN ('verified', 'probable', 'unknown')
  ),
  
  -- Session Information (from Google participant session)
  google_session_id TEXT,
  
  -- Raw Event Data
  raw_event_data JSONB,
  
  -- Processing
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  is_duplicate BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(event_id, appointment_id)
);

-- Indexes
CREATE INDEX idx_attendance_events_appointment_id ON public.attendance_events(appointment_id);
CREATE INDEX idx_attendance_events_user_id ON public.attendance_events(mapped_user_id);
CREATE INDEX idx_attendance_events_timestamp ON public.attendance_events(event_timestamp);
CREATE INDEX idx_attendance_events_type ON public.attendance_events(event_type);
CREATE INDEX idx_attendance_events_google_participant ON public.attendance_events(google_participant_id);
CREATE INDEX idx_attendance_events_google_session ON public.attendance_events(google_session_id);

-- RLS Policies
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all attendance events" 
  ON public.attendance_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

CREATE POLICY "Participants can view own attendance events" 
  ON public.attendance_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.id = attendance_events.appointment_id 
      AND (appointments.patient_id = auth.uid() OR appointments.psychiatrist_id = auth.uid())
    )
  );

-- ============================================================================
-- 5. PARTICIPANT SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.participant_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
  
  -- Participant Type
  participant_role TEXT NOT NULL CHECK (participant_role IN ('patient', 'psychiatrist')),
  
  -- Session Interval
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  
  -- Duration (calculated)
  duration_seconds INTEGER,
  
  -- Source
  source TEXT NOT NULL DEFAULT 'google_meet' CHECK (
    source IN ('google_meet', 'manual_adjustment', 'frontend_tracking')
  ),
  google_session_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_participant_sessions_appointment_id ON public.participant_sessions(appointment_id);
CREATE INDEX idx_participant_sessions_user_id ON public.participant_sessions(user_id);
CREATE INDEX idx_participant_sessions_role ON public.participant_sessions(participant_role);
CREATE INDEX idx_participant_sessions_joined_at ON public.participant_sessions(joined_at);

-- RLS Policies
ALTER TABLE public.participant_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own participation sessions" 
  ON public.participant_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all participation sessions" 
  ON public.participant_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- ============================================================================
-- 6. SESSION FINANCIALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.session_financials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE RESTRICT UNIQUE NOT NULL,
  
  -- Billing Duration
  scheduled_duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER,
  billable_duration_minutes INTEGER,
  
  -- Pricing
  base_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Commission
  commission_rate DECIMAL(5,4) NOT NULL, -- e.g., 0.2000 for 20%
  commission_amount DECIMAL(10,2) NOT NULL,
  psychiatrist_amount DECIMAL(10,2) NOT NULL,
  
  -- Adjustments
  refund_amount DECIMAL(10,2) DEFAULT 0,
  adjustment_amount DECIMAL(10,2) DEFAULT 0,
  adjustment_reason TEXT,
  
  -- Payment Fees (if tracked separately)
  payment_processing_fee DECIMAL(10,2) DEFAULT 0,
  
  -- Final Amounts
  net_platform_revenue DECIMAL(10,2) NOT NULL,
  net_psychiatrist_payout DECIMAL(10,2) NOT NULL,
  
  -- Status
  financial_status TEXT DEFAULT 'pending' CHECK (
    financial_status IN (
      'pending', 'calculated', 'payment_received', 'payout_pending', 
      'payout_completed', 'refunded', 'partially_refunded', 'disputed'
    )
  ),
  
  -- Payout Tracking
  payout_transaction_id TEXT,
  payout_completed_at TIMESTAMPTZ,
  
  -- Audit
  calculated_at TIMESTAMPTZ,
  calculated_by UUID REFERENCES public.profiles(id),
  last_modified_by UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation constraints
  CONSTRAINT valid_amounts CHECK (
    base_amount >= 0 AND 
    commission_amount >= 0 AND 
    psychiatrist_amount >= 0 AND
    refund_amount >= 0
  )
);

-- Indexes
CREATE INDEX idx_session_financials_appointment_id ON public.session_financials(appointment_id);
CREATE INDEX idx_session_financials_status ON public.session_financials(financial_status);
CREATE INDEX idx_session_financials_created_at ON public.session_financials(created_at DESC);

-- Index for psychiatrist payout queries
CREATE INDEX idx_session_financials_payout_pending ON public.session_financials(payout_completed_at) 
  WHERE financial_status = 'payout_pending';

-- RLS Policies
ALTER TABLE public.session_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychiatrists can view own session financials" 
  ON public.session_financials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.id = session_financials.appointment_id 
      AND appointments.psychiatrist_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view own session financials" 
  ON public.session_financials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.id = session_financials.appointment_id 
      AND appointments.patient_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all session financials" 
  ON public.session_financials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- ============================================================================
-- 7. COMMISSION LEDGER (Audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE RESTRICT NOT NULL,
  
  -- Transaction Type
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN (
      'booking_payment', 'commission_allocation', 'psychiatrist_payout', 
      'refund', 'adjustment', 'dispute_resolution', 'payment_fee'
    )
  ),
  
  -- Amounts
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Parties
  from_party TEXT CHECK (from_party IN ('patient', 'platform', 'psychiatrist', 'payment_provider')),
  to_party TEXT CHECK (to_party IN ('patient', 'platform', 'psychiatrist', 'payment_provider')),
  
  -- References
  reference_transaction_id TEXT,
  external_transaction_id TEXT,
  
  -- Metadata
  description TEXT NOT NULL,
  metadata JSONB,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_commission_ledger_appointment_id ON public.commission_ledger(appointment_id);
CREATE INDEX idx_commission_ledger_created_at ON public.commission_ledger(created_at DESC);
CREATE INDEX idx_commission_ledger_transaction_type ON public.commission_ledger(transaction_type);
CREATE INDEX idx_commission_ledger_created_by ON public.commission_ledger(created_by);

-- RLS Policies
ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all ledger entries" 
  ON public.commission_ledger FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

CREATE POLICY "Psychiatrists can view own ledger entries" 
  ON public.commission_ledger FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE appointments.id = commission_ledger.appointment_id 
      AND appointments.psychiatrist_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_appointment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointments_updated_at 
  BEFORE UPDATE ON public.appointments 
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trigger_availability_updated_at 
  BEFORE UPDATE ON public.psychiatrist_availability 
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trigger_google_meet_updated_at 
  BEFORE UPDATE ON public.google_meet_conferences 
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trigger_participant_sessions_updated_at 
  BEFORE UPDATE ON public.participant_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

CREATE TRIGGER trigger_session_financials_updated_at 
  BEFORE UPDATE ON public.session_financials 
  FOR EACH ROW EXECUTE FUNCTION update_appointment_updated_at();

-- Calculate duration when left_at is set
CREATE OR REPLACE FUNCTION calculate_participant_session_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.left_at IS NOT NULL AND NEW.joined_at IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_session_duration 
  BEFORE INSERT OR UPDATE ON public.participant_sessions 
  FOR EACH ROW EXECUTE FUNCTION calculate_participant_session_duration();

-- Auto-create session_financials when appointment is confirmed
CREATE OR REPLACE FUNCTION create_session_financials()
RETURNS TRIGGER AS $$
DECLARE
    v_base_amount DECIMAL(10,2);
    v_commission_rate DECIMAL(5,4);
    v_commission_amount DECIMAL(10,2);
    v_psychiatrist_amount DECIMAL(10,2);
BEGIN
    -- Only create financials when status changes to confirmed and payment is paid
    IF NEW.status = 'confirmed' AND NEW.payment_status = 'paid' AND OLD.status != 'confirmed' THEN
        -- Extract pricing from snapshot
        v_base_amount := (NEW.price_snapshot->>'amount')::DECIMAL(10,2);
        v_commission_rate := (NEW.price_snapshot->>'commission_rate')::DECIMAL(5,4);
        
        -- Calculate amounts
        v_commission_amount := ROUND(v_base_amount * v_commission_rate, 2);
        v_psychiatrist_amount := v_base_amount - v_commission_amount;
        
        -- Insert financial record
        INSERT INTO public.session_financials (
            appointment_id,
            scheduled_duration_minutes,
            base_amount,
            currency,
            commission_rate,
            commission_amount,
            psychiatrist_amount,
            net_platform_revenue,
            net_psychiatrist_payout,
            financial_status,
            calculated_at
        ) VALUES (
            NEW.id,
            NEW.duration_minutes,
            v_base_amount,
            COALESCE(NEW.price_snapshot->>'currency', 'USD'),
            v_commission_rate,
            v_commission_amount,
            v_psychiatrist_amount,
            v_commission_amount,
            v_psychiatrist_amount,
            'payment_received',
            NOW()
        )
        ON CONFLICT (appointment_id) DO NOTHING;
        
        -- Create initial ledger entries
        INSERT INTO public.commission_ledger (appointment_id, transaction_type, amount, from_party, to_party, description)
        VALUES 
            (NEW.id, 'booking_payment', v_base_amount, 'patient', 'platform', 'Session payment received'),
            (NEW.id, 'commission_allocation', v_commission_amount, 'platform', 'platform', 'Platform commission allocated');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_session_financials 
  AFTER UPDATE ON public.appointments 
  FOR EACH ROW EXECUTE FUNCTION create_session_financials();

-- ============================================================================
-- 9. FUNCTIONS
-- ============================================================================

-- Function to get available time slots for a psychiatrist on a specific date
CREATE OR REPLACE FUNCTION get_available_slots(
    p_psychiatrist_id UUID,
    p_date DATE,
    p_duration_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
    slot_start_time TIMESTAMPTZ,
    slot_end_time TIMESTAMPTZ,
    is_available BOOLEAN
) AS $$
DECLARE
    v_day_of_week INTEGER;
BEGIN
    -- Get day of week (0-6, Sunday-Saturday)
    v_day_of_week := EXTRACT(DOW FROM p_date);
    
    -- Return available slots based on availability and existing bookings
    RETURN QUERY
    WITH availability_slots AS (
        SELECT 
            (p_date + pa.start_time)::TIMESTAMPTZ as slot_start,
            (p_date + pa.end_time)::TIMESTAMPTZ as slot_end,
            pa.timezone
        FROM public.psychiatrist_availability pa
        WHERE pa.psychiatrist_id = p_psychiatrist_id
        AND pa.day_of_week = v_day_of_week
        AND pa.is_active = TRUE
    ),
    time_slots AS (
        SELECT 
            generate_series(
                slot_start,
                slot_end - (p_duration_minutes || ' minutes')::INTERVAL,
                (p_duration_minutes || ' minutes')::INTERVAL
            ) as slot_time
        FROM availability_slots
    )
    SELECT 
        ts.slot_time as slot_start_time,
        ts.slot_time + (p_duration_minutes || ' minutes')::INTERVAL as slot_end_time,
        NOT EXISTS (
            SELECT 1 FROM public.appointments a
            WHERE a.psychiatrist_id = p_psychiatrist_id
            AND a.status NOT IN ('cancelled', 'completed')
            AND tstzrange(a.scheduled_start_time, a.scheduled_end_time) && 
                tstzrange(ts.slot_time, ts.slot_time + (p_duration_minutes || ' minutes')::INTERVAL)
        ) as is_available
    FROM time_slots ts
    ORDER BY ts.slot_time;
END;
$$ LANGUAGE plpgsql;

-- Function to check if psychiatrist is available for immediate booking
CREATE OR REPLACE FUNCTION is_psychiatrist_available_now(
    p_psychiatrist_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_available BOOLEAN;
BEGIN
    SELECT NOT EXISTS (
        SELECT 1 FROM public.appointments
        WHERE psychiatrist_id = p_psychiatrist_id
        AND status IN ('in_progress', 'ready')
        AND scheduled_end_time > NOW()
    ) INTO v_is_available;
    
    RETURN v_is_available;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate billable duration from participant sessions
CREATE OR REPLACE FUNCTION calculate_billable_duration(
    p_appointment_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_billable_seconds INTEGER;
BEGIN
    -- Calculate overlapping time where both patient and psychiatrist were present
    WITH patient_intervals AS (
        SELECT 
            tstzrange(joined_at, COALESCE(left_at, NOW())) as interval
        FROM public.participant_sessions
        WHERE appointment_id = p_appointment_id
        AND participant_role = 'patient'
    ),
    psychiatrist_intervals AS (
        SELECT 
            tstzrange(joined_at, COALESCE(left_at, NOW())) as interval
        FROM public.participant_sessions
        WHERE appointment_id = p_appointment_id
        AND participant_role = 'psychiatrist'
    ),
    overlap_intervals AS (
        SELECT 
            p.interval * ps.interval as overlap_interval
        FROM patient_intervals p
        CROSS JOIN psychiatrist_intervals ps
        WHERE p.interval && ps.interval
    )
    SELECT 
        COALESCE(SUM(EXTRACT(EPOCH FROM upper(overlap_interval) - lower(overlap_interval))::INTEGER), 0)
    INTO v_billable_seconds
    FROM overlap_intervals;
    
    -- Return duration in minutes (rounded down)
    RETURN FLOOR(v_billable_seconds / 60);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. INITIAL DATA / CONFIGURATION
-- ============================================================================

-- Insert default pricing configuration into a config table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert session pricing
INSERT INTO public.system_config (key, value, description)
VALUES 
    ('session_pricing', 
     '{"15": 1500, "30": 3000, "60": 6000, "currency": "USD"}'::JSONB,
     'Session pricing in cents (15min, 30min, 60min)')
ON CONFLICT (key) DO NOTHING;

-- Insert platform commission rate
INSERT INTO public.system_config (key, value, description)
VALUES 
    ('platform_commission_rate', 
     '{"rate": 0.20, "effective_date": "2026-11-04"}'::JSONB,
     'Platform commission rate (20%)')
ON CONFLICT (key) DO NOTHING;

-- Insert session configuration
INSERT INTO public.system_config (key, value, description)
VALUES 
    ('session_config', 
     '{"join_window_minutes": 15, "grace_period_minutes": 5, "max_extension_minutes": 30}'::JSONB,
     'Session timing configuration')
ON CONFLICT (key) DO NOTHING;

-- RLS for system_config
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system config" 
  ON public.system_config FOR SELECT 
  USING (true);

CREATE POLICY "Only admin can modify system config" 
  ON public.system_config FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comments to tables for documentation
COMMENT ON TABLE public.appointments IS 'Core appointment booking table with scheduling, payment, and status tracking';
COMMENT ON TABLE public.google_meet_conferences IS 'Google Meet conference metadata and reconciliation status';
COMMENT ON TABLE public.attendance_events IS 'Raw attendance events from Google Meet for audit trail';
COMMENT ON TABLE public.participant_sessions IS 'Calculated join/leave intervals for billing';
COMMENT ON TABLE public.session_financials IS 'Financial calculations and commission tracking per appointment';
COMMENT ON TABLE public.commission_ledger IS 'Auditable ledger of all financial transactions';
COMMENT ON TABLE public.psychiatrist_availability IS 'Psychiatrist weekly availability schedule';
COMMENT ON TABLE public.system_config IS 'System-wide configuration for pricing and session settings';

-- Verification query to confirm all tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'appointments', 'google_meet_conferences', 'attendance_events',
        'participant_sessions', 'session_financials', 'commission_ledger',
        'psychiatrist_availability', 'system_config'
    );
    
    RAISE NOTICE 'Migration complete. Created % tables.', table_count;
END $$;
