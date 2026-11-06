-- ============================================================================
-- TalkFriendly Appointment System - ROLLBACK Script
-- Migration: 006_rollback
-- Date: November 4, 2026
-- Description: Safely removes all appointment system tables and functions
-- WARNING: This will delete all appointment, attendance, and financial data
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS trigger_availability_updated_at ON public.psychiatrist_availability;
DROP TRIGGER IF EXISTS trigger_google_meet_updated_at ON public.google_meet_conferences;
DROP TRIGGER IF EXISTS trigger_participant_sessions_updated_at ON public.participant_sessions;
DROP TRIGGER IF EXISTS trigger_session_financials_updated_at ON public.session_financials;
DROP TRIGGER IF EXISTS trigger_calculate_session_duration ON public.participant_sessions;
DROP TRIGGER IF EXISTS trigger_create_session_financials ON public.appointments;

-- Drop functions
DROP FUNCTION IF EXISTS update_appointment_updated_at();
DROP FUNCTION IF EXISTS calculate_participant_session_duration();
DROP FUNCTION IF EXISTS create_session_financials();
DROP FUNCTION IF EXISTS get_available_slots(UUID, DATE, INTEGER);
DROP FUNCTION IF EXISTS is_psychiatrist_available_now(UUID);
DROP FUNCTION IF EXISTS calculate_billable_duration(UUID);

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS public.commission_ledger CASCADE;
DROP TABLE IF EXISTS public.session_financials CASCADE;
DROP TABLE IF EXISTS public.participant_sessions CASCADE;
DROP TABLE IF EXISTS public.attendance_events CASCADE;
DROP TABLE IF EXISTS public.google_meet_conferences CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.psychiatrist_availability CASCADE;
DROP TABLE IF EXISTS public.system_config CASCADE;

-- Verification
DO $$
DECLARE
    remaining_tables INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_tables
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'appointments', 'google_meet_conferences', 'attendance_events',
        'participant_sessions', 'session_financials', 'commission_ledger',
        'psychiatrist_availability', 'system_config'
    );
    
    IF remaining_tables = 0 THEN
        RAISE NOTICE 'Rollback complete. All appointment system tables removed.';
    ELSE
        RAISE WARNING 'Rollback incomplete. % tables still exist.', remaining_tables;
    END IF;
END $$;
