-- ============================================================================
-- Session Booking System for Listeners
-- This replaces the generic support_forms with a specific booking system
-- ============================================================================

-- ============================================================================
-- 1. Session Booking Forms (Listener's Availability & Pricing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.session_booking_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listener_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Book a Session',
  description TEXT,
  
  -- Available time slots (array of datetime strings)
  available_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   {"date": "2024-01-15", "time": "09:00", "timezone": "UTC"},
  --   {"date": "2024-01-15", "time": "14:00", "timezone": "UTC"}
  -- ]
  
  -- Duration options with prices
  duration_pricing JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Example: {
  --   "15": 25,   // 15 mins = $25
  --   "30": 45,   // 30 mins = $45
  --   "45": 65,   // 45 mins = $65
  --   "60": 80    // 60 mins = $80
  -- }
  
  -- Support areas (optional suggestions)
  support_areas JSONB DEFAULT '["Anxiety", "Depression", "Stress", "Relationships", "Career", "Other"]'::jsonb,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_booking_forms_listener_id ON public.session_booking_forms(listener_id);
CREATE INDEX IF NOT EXISTS idx_session_booking_forms_is_active ON public.session_booking_forms(is_active);

-- Enable RLS (policies added later after session_bookings table exists)
ALTER TABLE public.session_booking_forms ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Session Bookings (User's Booking Requests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.session_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_form_id UUID NOT NULL REFERENCES public.session_booking_forms(id) ON DELETE CASCADE,
  listener_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  
  -- Selected slot
  selected_slot JSONB NOT NULL,
  -- Example: {"date": "2024-01-15", "time": "09:00", "timezone": "UTC"}
  
  -- Selected duration (in minutes)
  selected_duration INTEGER NOT NULL CHECK (selected_duration IN (15, 30, 45, 60)),
  
  -- Price at time of booking
  price_amount INTEGER NOT NULL, -- in cents
  
  -- User's support needs
  support_area TEXT,
  support_details TEXT NOT NULL,
  
  -- Booking status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')
  ),
  
  -- Meeting details (added after confirmation)
  meeting_url TEXT,
  meeting_notes TEXT,
  
  -- Timestamps
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_bookings_booking_form_id ON public.session_bookings(booking_form_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_listener_id ON public.session_bookings(listener_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_user_id ON public.session_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_conversation_id ON public.session_bookings(conversation_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_status ON public.session_bookings(status);
CREATE INDEX IF NOT EXISTS idx_session_bookings_booked_at ON public.session_bookings(booked_at);

-- Enable RLS
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own bookings"
  ON public.session_bookings
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Listeners can view and manage bookings for their forms"
  ON public.session_bookings
  FOR ALL
  USING (listener_id = auth.uid())
  WITH CHECK (listener_id = auth.uid());

-- ============================================================================
-- 3. Feedback System (Keep existing if needed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feedback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  listener_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_booking_id UUID REFERENCES public.session_bookings(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  categories JSONB DEFAULT '["Communication", "Helpfulness", "Professionalism"]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_requests_conversation_id ON public.feedback_requests(conversation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_listener_id ON public.feedback_requests(listener_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_user_id ON public.feedback_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_session_booking_id ON public.feedback_requests(session_booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_status ON public.feedback_requests(status);

ALTER TABLE public.feedback_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage feedback requests sent to them"
  ON public.feedback_requests
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Listeners can manage their feedback requests"
  ON public.feedback_requests
  FOR ALL
  USING (listener_id = auth.uid())
  WITH CHECK (listener_id = auth.uid());

-- ============================================================================
-- 4. Feedback Responses
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_request_id UUID NOT NULL REFERENCES public.feedback_requests(id) ON DELETE CASCADE,
  listener_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_booking_id UUID REFERENCES public.session_bookings(id) ON DELETE SET NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  category_ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  comment TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_responses_feedback_request_id ON public.feedback_responses(feedback_request_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_listener_id ON public.feedback_responses(listener_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_user_id ON public.feedback_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_session_booking_id ON public.feedback_responses(session_booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_is_public ON public.feedback_responses(is_public);

ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own feedback responses"
  ON public.feedback_responses
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Listeners can read public feedback about them"
  ON public.feedback_responses
  FOR SELECT
  USING (listener_id = auth.uid() AND is_public = true);

CREATE POLICY "Admins can read all feedback"
  ON public.feedback_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND account_type = 'admin'
    )
  );

-- ============================================================================
-- RLS Policies for session_booking_forms (now that session_bookings exists)
-- ============================================================================

CREATE POLICY "Listeners can manage their own booking forms"
  ON public.session_booking_forms
  FOR ALL
  USING (listener_id = auth.uid())
  WITH CHECK (listener_id = auth.uid());

CREATE POLICY "Users can view active booking forms sent to them"
  ON public.session_booking_forms
  FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.session_bookings
      WHERE session_bookings.booking_form_id = session_booking_forms.id
      AND session_bookings.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. Update Triggers
-- ============================================================================

-- Trigger to validate listener account type
CREATE OR REPLACE FUNCTION validate_listener_account_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = NEW.listener_id AND account_type = 'listener'
  ) THEN
    RAISE EXCEPTION 'Only users with account_type=listener can create booking forms';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_listener_booking_form
  BEFORE INSERT OR UPDATE ON public.session_booking_forms
  FOR EACH ROW
  EXECUTE FUNCTION validate_listener_account_type();

-- Trigger to update updated_at timestamp for session_booking_forms
CREATE OR REPLACE FUNCTION update_booking_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_booking_forms_updated_at
  BEFORE UPDATE ON public.session_booking_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_forms_updated_at();

CREATE OR REPLACE FUNCTION update_session_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_bookings_updated_at
  BEFORE UPDATE ON public.session_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_session_bookings_updated_at();

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
-- 6. Helper Function: Get Listener's Available Slots
-- ============================================================================
CREATE OR REPLACE FUNCTION get_listener_available_slots(listener_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  slots JSONB;
BEGIN
  SELECT available_slots INTO slots
  FROM public.session_booking_forms
  WHERE listener_id = listener_uuid
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  RETURN COALESCE(slots, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Helper Function: Calculate Booking Price
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_booking_price(
  booking_form_uuid UUID,
  duration_mins INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  pricing JSONB;
  price INTEGER;
BEGIN
  SELECT duration_pricing INTO pricing
  FROM public.session_booking_forms
  WHERE id = booking_form_uuid;
  
  price := (pricing->>duration_mins::TEXT)::INTEGER;
  
  IF price IS NULL THEN
    RAISE EXCEPTION 'Invalid duration or pricing not set';
  END IF;
  
  RETURN price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Comments
-- ============================================================================

COMMENT ON TABLE public.session_booking_forms IS 'Booking forms created by listeners with their availability and pricing';
COMMENT ON TABLE public.session_bookings IS 'Session bookings made by users';
COMMENT ON TABLE public.feedback_requests IS 'Feedback requests sent by listeners to users after sessions';
COMMENT ON TABLE public.feedback_responses IS 'User feedback about completed sessions';

-- ============================================================================
-- Done!
-- ============================================================================

SELECT 'Session Booking System created successfully!' as status;
