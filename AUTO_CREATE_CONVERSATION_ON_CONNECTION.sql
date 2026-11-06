-- ============================================================================
-- AUTO-CREATE CONVERSATION WHEN CONNECTION IS ACCEPTED
-- This creates an empty conversation as soon as users become connected
-- ============================================================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_create_conversation_on_connection ON user_connections;
DROP FUNCTION IF EXISTS create_conversation_on_connection();

-- Create function to auto-create conversation
CREATE OR REPLACE FUNCTION create_conversation_on_connection()
RETURNS TRIGGER AS $$
DECLARE
    v_conversation_id UUID;
    v_participant_1 UUID;
    v_participant_2 UUID;
BEGIN
    -- Only create conversation when connection is accepted
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        
        -- Normalize participant order (smaller UUID first for consistency)
        IF NEW.user_id < NEW.connected_user_id THEN
            v_participant_1 := NEW.user_id;
            v_participant_2 := NEW.connected_user_id;
        ELSE
            v_participant_1 := NEW.connected_user_id;
            v_participant_2 := NEW.user_id;
        END IF;
        
        -- Check if conversation already exists
        SELECT id INTO v_conversation_id
        FROM conversations
        WHERE participant_1_id = v_participant_1 
          AND participant_2_id = v_participant_2;
        
        -- Create conversation if it doesn't exist
        IF v_conversation_id IS NULL THEN
            INSERT INTO conversations (
                participant_1_id,
                participant_2_id,
                last_message_at,
                last_message_preview,
                participant_1_unread_count,
                participant_2_unread_count
            ) VALUES (
                v_participant_1,
                v_participant_2,
                NULL,
                NULL,
                0,
                0
            )
            RETURNING id INTO v_conversation_id;
            
            RAISE NOTICE '✅ Auto-created conversation % for connection between % and %', 
                v_conversation_id, v_participant_1, v_participant_2;
        ELSE
            RAISE NOTICE 'ℹ️ Conversation % already exists for connection between % and %', 
                v_conversation_id, v_participant_1, v_participant_2;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_create_conversation_on_connection
    AFTER INSERT OR UPDATE OF status ON user_connections
    FOR EACH ROW
    EXECUTE FUNCTION create_conversation_on_connection();

-- ============================================================================
-- CREATE CONVERSATIONS FOR EXISTING CONNECTIONS
-- Run this to create conversations for all existing accepted connections
-- ============================================================================

DO $$
DECLARE
    v_connection RECORD;
    v_conversation_id UUID;
    v_participant_1 UUID;
    v_participant_2 UUID;
    v_created_count INTEGER := 0;
    v_existing_count INTEGER := 0;
BEGIN
    -- Loop through all accepted connections
    FOR v_connection IN 
        SELECT DISTINCT
            CASE WHEN user_id < connected_user_id THEN user_id ELSE connected_user_id END AS participant_1_id,
            CASE WHEN user_id < connected_user_id THEN connected_user_id ELSE user_id END AS participant_2_id
        FROM user_connections
        WHERE status = 'accepted'
    LOOP
        -- Check if conversation exists
        SELECT id INTO v_conversation_id
        FROM conversations
        WHERE participant_1_id = v_connection.participant_1_id 
          AND participant_2_id = v_connection.participant_2_id;
        
        -- Create if doesn't exist
        IF v_conversation_id IS NULL THEN
            INSERT INTO conversations (
                participant_1_id,
                participant_2_id,
                last_message_at,
                last_message_preview,
                participant_1_unread_count,
                participant_2_unread_count
            ) VALUES (
                v_connection.participant_1_id,
                v_connection.participant_2_id,
                NULL,
                NULL,
                0,
                0
            );
            
            v_created_count := v_created_count + 1;
        ELSE
            v_existing_count := v_existing_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Created % new conversations for existing connections', v_created_count;
    RAISE NOTICE 'ℹ️ Found % conversations that already existed', v_existing_count;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all connections with their conversations
SELECT 
    uc.id AS connection_id,
    uc.user_id,
    uc.connected_user_id,
    uc.status,
    c.id AS conversation_id,
    c.last_message_preview,
    CASE 
        WHEN c.id IS NULL THEN '❌ No conversation'
        ELSE '✅ Has conversation'
    END AS conversation_status
FROM user_connections uc
LEFT JOIN conversations c ON (
    (c.participant_1_id = uc.user_id AND c.participant_2_id = uc.connected_user_id)
    OR
    (c.participant_1_id = uc.connected_user_id AND c.participant_2_id = uc.user_id)
)
WHERE uc.status = 'accepted'
ORDER BY uc.created_at DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 
    '🎉 Auto-conversation creation enabled!' AS status,
    'New conversations will be created automatically when connections are accepted' AS info;
