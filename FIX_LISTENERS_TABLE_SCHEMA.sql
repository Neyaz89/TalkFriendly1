-- ============================================
-- FIX: Add Missing Columns to Listeners Table
-- ============================================
-- Adds is_available column and ensures other
-- columns match what the code expects
-- ============================================

-- Add is_available column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listeners' 
    AND column_name = 'is_available'
  ) THEN
    ALTER TABLE public.listeners 
    ADD COLUMN is_available BOOLEAN DEFAULT true;
    
    RAISE NOTICE '✅ Added is_available column to listeners table';
  ELSE
    RAISE NOTICE '⚠️  is_available column already exists';
  END IF;
END $$;

-- Ensure accepts_new_patients column exists (for Phase 3 compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'listeners' 
    AND column_name = 'accepts_new_patients'
  ) THEN
    ALTER TABLE public.listeners 
    ADD COLUMN accepts_new_patients BOOLEAN DEFAULT true;
    
    RAISE NOTICE '✅ Added accepts_new_patients column to listeners table';
  ELSE
    RAISE NOTICE '⚠️  accepts_new_patients column already exists';
  END IF;
END $$;

-- Update existing listeners to be available
UPDATE public.listeners 
SET is_available = true 
WHERE is_available IS NULL;

UPDATE public.listeners 
SET accepts_new_patients = true 
WHERE accepts_new_patients IS NULL;

-- Add helpful comment
COMMENT ON COLUMN public.listeners.is_available IS 
'Whether the listener is currently available for new bookings (real-time availability)';

COMMENT ON COLUMN public.listeners.accepts_new_patients IS 
'Whether the listener is accepting new patients in general (long-term availability)';

-- Verify columns exist
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'listeners' 
  AND column_name IN ('is_available', 'accepts_new_patients');
  
  IF col_count = 2 THEN
    RAISE NOTICE '✅ SUCCESS! Listeners table schema fixed!';
    RAISE NOTICE '';
    RAISE NOTICE 'Columns added/verified:';
    RAISE NOTICE '  ✅ is_available (real-time availability)';
    RAISE NOTICE '  ✅ accepts_new_patients (general availability)';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Try listener registration again!';
  ELSE
    RAISE WARNING '⚠️  Expected 2 columns, found %', col_count;
  END IF;
END $$;
