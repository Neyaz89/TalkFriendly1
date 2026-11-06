-- ============================================================================
-- ENABLE REALTIME FOR MESSAGING
-- Run this in Supabase SQL Editor to enable real-time updates
-- ============================================================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for conversations table (for unread counts)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Verify realtime is enabled
SELECT 
    schemaname,
    tablename,
    'Realtime enabled' as status
FROM 
    pg_publication_tables
WHERE 
    pubname = 'supabase_realtime'
    AND tablename IN ('messages', 'conversations');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT '✅ Realtime enabled for messaging tables!' as status;
