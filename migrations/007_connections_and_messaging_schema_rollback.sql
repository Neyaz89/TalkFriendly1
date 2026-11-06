-- ============================================================================
-- ROLLBACK: CONNECTIONS AND MESSAGING SYSTEM
-- Run this first to clean up before re-applying the migration
-- ============================================================================

-- Drop triggers first
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
DROP TRIGGER IF EXISTS trigger_reset_unread_on_read ON messages;
DROP TRIGGER IF EXISTS trigger_update_connection_timestamp ON user_connections;

-- Drop functions
DROP FUNCTION IF EXISTS update_conversation_on_message();
DROP FUNCTION IF EXISTS reset_unread_on_read();
DROP FUNCTION IF EXISTS update_connection_timestamp();
DROP FUNCTION IF EXISTS get_or_create_conversation(UUID, UUID);
DROP FUNCTION IF EXISTS are_users_connected(UUID, UUID);

-- Drop policies (must drop before tables)
DROP POLICY IF EXISTS "Users can view their own connections" ON user_connections;
DROP POLICY IF EXISTS "Users can create connection requests" ON user_connections;
DROP POLICY IF EXISTS "Users can update their connections" ON user_connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON user_connections;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Connected users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Connected users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can soft delete their messages" ON messages;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_connections CASCADE;

-- Verify cleanup
SELECT 'Cleanup complete! Now run the main migration.' AS status;
