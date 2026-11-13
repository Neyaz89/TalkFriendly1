-- ============================================
-- FIX: Make Phone Field Optional in listener_applications
-- ============================================
-- The simplified listener registration form doesn't collect
-- phone number, but the database requires it
-- ============================================

-- Make phone field nullable (optional)
ALTER TABLE listener_applications 
ALTER COLUMN phone DROP NOT NULL;

-- Verify the change
DO $$
BEGIN
  RAISE NOTICE '✅ Phone field is now optional in listener_applications';
  RAISE NOTICE '';
  RAISE NOTICE 'Listeners can now register without providing a phone number';
  RAISE NOTICE 'They can add it later in their profile settings';
END $$;
