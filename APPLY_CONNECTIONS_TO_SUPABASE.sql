-- ============================================================================
-- CONNECTIONS AND MESSAGING SYSTEM - APPLY TO SUPABASE
-- Copy this entire file and run it in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create user_connections table
CREATE TABLE IF NOT EXISTS user_connections (
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

-- Step 2: Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
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

-- Step 3: Create messages table
CREATE TABLE IF NOT EXISTS messages (
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

-- Step 4: Create helper functions
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

-- Step 5: Create triggers
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
        -- Increment unread count for receiver
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
        
        -- Update unread counts
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

-- Step 6: Enable RLS
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies for user_connections
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

-- Step 8: Create RLS policies for conversations
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

-- Step 9: Create RLS policies for messages
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

-- Step 10: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify everything is set up correctly
-- ============================================================================

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_connections', 'conversations', 'messages');

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_connections', 'conversations', 'messages');

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_or_create_conversation', 'are_users_connected');

-- ============================================================================
-- SUCCESS!
-- If all queries above return results, the system is ready to use.
-- ============================================================================
