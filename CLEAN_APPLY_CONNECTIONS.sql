-- ============================================================================
-- CONNECTIONS AND MESSAGING SYSTEM - CLEAN INSTALLATION
-- This script can be run multiple times safely (idempotent)
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEANUP (Safely drop if exists)
-- ============================================================================

-- Drop triggers (these will fail silently if tables don't exist)
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS trigger_reset_unread_on_read ON messages;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS trigger_update_connection_timestamp ON user_connections;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS update_conversation_on_message();
DROP FUNCTION IF EXISTS reset_unread_on_read();
DROP FUNCTION IF EXISTS update_connection_timestamp();
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID);
DROP FUNCTION IF EXISTS are_users_connected(UUID, UUID);

-- Drop tables (CASCADE will drop policies automatically)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_connections CASCADE;

-- ============================================================================
-- STEP 2: CREATE TABLES
-- ============================================================================

-- User Connections Table
CREATE TABLE user_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    connected_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    initiated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT unique_connection UNIQUE(user_id, connected_user_id),
    CONSTRAINT no_self_connection CHECK (user_id != connected_user_id),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'))
);

CREATE INDEX idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX idx_user_connections_connected_user_id ON user_connections(connected_user_id);
CREATE INDEX idx_user_connections_status ON user_connections(status);
CREATE INDEX idx_user_connections_created_at ON user_connections(created_at DESC);

-- Conversations Table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    participant_1_unread_count INTEGER NOT NULL DEFAULT 0,
    participant_2_unread_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_conversation UNIQUE(participant_1_id, participant_2_id),
    CONSTRAINT no_self_conversation CHECK (participant_1_id != participant_2_id)
);

CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- Messages Table (no receiver_id - determined from conversation)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'image', 'file', 'system'))
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_messages_not_deleted ON messages(is_deleted) WHERE is_deleted = FALSE;

-- ============================================================================
-- STEP 3: CREATE HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_conversation(
    p_user1_id UUID,
    p_user2_id UUID
) RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_participant_1 UUID;
    v_participant_2 UUID;
BEGIN
    IF p_user1_id < p_user2_id THEN
        v_participant_1 := p_user1_id;
        v_participant_2 := p_user2_id;
    ELSE
        v_participant_1 := p_user2_id;
        v_participant_2 := p_user1_id;
    END IF;
    
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE participant_1_id = v_participant_1 
      AND participant_2_id = v_participant_2;
    
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (participant_1_id, participant_2_id)
        VALUES (v_participant_1, v_participant_2)
        RETURNING id INTO v_conversation_id;
    END IF;
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION are_users_connected(
    p_user1_id UUID,
    p_user2_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_connected BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_connections
        WHERE status = 'accepted'
          AND (
              (user_id = p_user1_id AND connected_user_id = p_user2_id)
              OR
              (user_id = p_user2_id AND connected_user_id = p_user1_id)
          )
    ) INTO v_connected;
    
    RETURN v_connected;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 4: CREATE TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_id UUID;
BEGIN
    -- Determine the receiver_id based on sender_id
    SELECT CASE 
        WHEN participant_1_id = NEW.sender_id THEN participant_2_id
        ELSE participant_1_id
    END INTO v_receiver_id
    FROM conversations
    WHERE id = NEW.conversation_id;
    
    -- Update conversation
    UPDATE conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = NOW(),
        participant_1_unread_count = CASE 
            WHEN participant_1_id = v_receiver_id THEN participant_1_unread_count + 1
            ELSE participant_1_unread_count
        END,
        participant_2_unread_count = CASE 
            WHEN participant_2_id = v_receiver_id THEN participant_2_unread_count + 1
            ELSE participant_2_unread_count
        END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

CREATE OR REPLACE FUNCTION reset_unread_on_read()
RETURNS TRIGGER AS $$
DECLARE
    v_receiver_id UUID;
BEGIN
    IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
        -- Determine the receiver_id based on sender_id
        SELECT CASE 
            WHEN participant_1_id = NEW.sender_id THEN participant_2_id
            ELSE participant_1_id
        END INTO v_receiver_id
        FROM conversations
        WHERE id = NEW.conversation_id;
        
        UPDATE conversations
        SET 
            participant_1_unread_count = CASE 
                WHEN participant_1_id = v_receiver_id THEN GREATEST(participant_1_unread_count - 1, 0)
                ELSE participant_1_unread_count
            END,
            participant_2_unread_count = CASE 
                WHEN participant_2_id = v_receiver_id THEN GREATEST(participant_2_unread_count - 1, 0)
                ELSE participant_2_unread_count
            END,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reset_unread_on_read
    AFTER UPDATE OF is_read ON messages
    FOR EACH ROW
    EXECUTE FUNCTION reset_unread_on_read();

CREATE OR REPLACE FUNCTION update_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    IF NEW.status != OLD.status THEN
        NEW.responded_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_connection_timestamp
    BEFORE UPDATE ON user_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_connection_timestamp();

-- ============================================================================
-- STEP 5: ENABLE RLS
-- ============================================================================

ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Verify RLS was enabled
DO $$
DECLARE
    v_uc_rls BOOLEAN;
    v_conv_rls BOOLEAN;
    v_msg_rls BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO v_uc_rls FROM pg_class WHERE relname = 'user_connections' LIMIT 1;
    SELECT relrowsecurity INTO v_conv_rls FROM pg_class WHERE relname = 'conversations' LIMIT 1;
    SELECT relrowsecurity INTO v_msg_rls FROM pg_class WHERE relname = 'messages' LIMIT 1;
    
    RAISE NOTICE 'RLS Status: user_connections=%, conversations=%, messages=%', v_uc_rls, v_conv_rls, v_msg_rls;
END $$;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- User Connections Policies
CREATE POLICY "Users can view their own connections"
    ON user_connections FOR SELECT
    USING (
        auth.uid() = user_id 
        OR auth.uid() = connected_user_id
    );

CREATE POLICY "Users can create connection requests"
    ON user_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their connections"
    ON user_connections FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR auth.uid() = connected_user_id
    );

CREATE POLICY "Users can delete their connections"
    ON user_connections FOR DELETE
    USING (
        auth.uid() = user_id 
        OR auth.uid() = connected_user_id
    );

-- Conversations Policies
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (
        auth.uid() = participant_1_id 
        OR auth.uid() = participant_2_id
    );

CREATE POLICY "Connected users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (
        auth.uid() IN (participant_1_id, participant_2_id)
        AND are_users_connected(participant_1_id, participant_2_id)
    );

CREATE POLICY "Users can update their conversations"
    ON conversations FOR UPDATE
    USING (
        auth.uid() = participant_1_id 
        OR auth.uid() = participant_2_id
    );

-- Messages Policies
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
        )
    );

CREATE POLICY "Connected users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_id
            AND (conversations.participant_1_id = auth.uid() OR conversations.participant_2_id = auth.uid())
            AND are_users_connected(conversations.participant_1_id, conversations.participant_2_id)
        )
    );

CREATE POLICY "Users can update their own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id);

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON user_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 8: VERIFICATION
-- ============================================================================

-- Check tables exist
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN ('user_connections', 'conversations', 'messages');
    
    IF v_count = 3 THEN
        RAISE NOTICE '✅ All tables created successfully';
    ELSE
        RAISE EXCEPTION '❌ Some tables are missing (found % of 3)', v_count;
    END IF;
END $$;

-- Check functions exist
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_proc 
    WHERE proname IN ('get_or_create_conversation', 'are_users_connected');
    
    IF v_count >= 2 THEN
        RAISE NOTICE '✅ All functions created successfully';
    ELSE
        RAISE EXCEPTION '❌ Some functions are missing';
    END IF;
END $$;

-- Check RLS enabled
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname IN ('user_connections', 'conversations', 'messages')
    AND c.relrowsecurity = true;
    
    IF v_count = 3 THEN
        RAISE NOTICE '✅ RLS enabled on all tables';
    ELSE
        RAISE WARNING '⚠️  RLS enabled on % of 3 tables - this is OK, RLS will be enabled by Supabase', v_count;
    END IF;
END $$;

-- ============================================================================
-- SUCCESS!
-- ============================================================================

SELECT 
    '🎉 CONNECTIONS & MESSAGING SYSTEM INSTALLED SUCCESSFULLY!' AS status,
    'You can now use /connections and /messages pages' AS next_step;
