# Connection Request Workflow

## Overview

The TalkFriendly connection system enables normal users to connect with listeners (and other users) to establish communication. Once connected, users can message each other in real-time.

## Connection Types

### User → Listener Connection
- Normal users can send connection requests to verified listeners
- Listeners receive notifications when users request to connect
- Upon acceptance, both parties can communicate via chat

### User → User Connection
- Users can also connect with other normal users
- Same workflow applies (request → accept/reject → chat)

## Workflow

### 1. Sending a Connection Request

**Endpoint:** `POST /api/connections/send`

**Request:**
```json
{
  "target_user_id": "uuid-of-target-user"
}
```

**Process:**
1. Validates requester is authenticated
2. Prevents self-connections
3. Checks if connection already exists
4. Creates `user_connections` record with `status='pending'`
5. Sends notification to target user
6. Returns success response

**Notification Created:**
- **Type:** `connection_request`
- **Title:** "New Connection Request"
- **Message:** "[Name] wants to connect with you [as a listener]"
- **Link:** `/connections/requests`

**Database:**
```sql
INSERT INTO user_connections (
  user_id,              -- Requester
  connected_user_id,    -- Target (listener or user)
  initiated_by,         -- Requester
  status                -- 'pending'
)
```

### 2. Receiving Connection Requests

**Service:** `connectionService.getConnectionRequests()`

**Returns:**
- List of pending connection requests
- Sender profile information
- Request timestamps

**UI Display:**
- Shows sender name, avatar, bio
- Shows "Accept" and "Reject" buttons
- Shows request date

### 3. Accepting a Connection Request

**Endpoint:** `POST /api/connections/respond`

**Request:**
```json
{
  "connection_id": "uuid-of-connection",
  "status": "accepted"
}
```

**Process:**
1. Validates responder is the connection recipient
2. Updates connection status to `'accepted'`
3. Sets `responded_at` timestamp
4. Creates notification for requester
5. **Auto-creates conversation** (via trigger)

**Notification Created:**
- **Type:** `connection_accepted`
- **Title:** "Connection Request Accepted"
- **Message:** "[Name] accepted your connection request"
- **Link:** `/messages/{connection_id}`

**Conversation Auto-Creation:**

When connection status changes to `'accepted'`, a database trigger automatically creates a conversation:

```sql
CREATE TRIGGER trigger_create_conversation_on_connection
    AFTER INSERT OR UPDATE OF status ON user_connections
    EXECUTE FUNCTION create_conversation_on_connection();
```

This ensures both parties can immediately start messaging.

### 4. Rejecting a Connection Request

**Endpoint:** `POST /api/connections/respond`

**Request:**
```json
{
  "connection_id": "uuid-of-connection",
  "status": "rejected"
}
```

**Process:**
1. Updates connection status to `'rejected'`
2. Sets `responded_at` timestamp
3. No notification sent (silent rejection)

### 5. Viewing Connections

**Service:** `connectionService.getConnections()`

**Filters:**
- `status`: 'pending', 'accepted', 'rejected', 'blocked'
- `page`: Pagination
- `limit`: Results per page

**Returns:**
- List of connections with status
- Other user's profile information
- Connection metadata (created_at, responded_at)

### 6. Messaging After Connection

Once connection is accepted:

1. **Conversation automatically exists** (created by trigger)
2. Both parties can access `/messages/{conversation_id}`
3. Real-time messaging enabled via Supabase Realtime
4. Message types supported:
   - Text messages
   - Image attachments
   - File attachments
   - System messages (Phase 5: forms, feedback)

## Database Schema

### user_connections Table

```sql
CREATE TABLE user_connections (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,              -- Person A
    connected_user_id UUID NOT NULL,     -- Person B
    status VARCHAR(20),                  -- 'pending', 'accepted', 'rejected', 'blocked'
    initiated_by UUID NOT NULL,          -- Who sent the request
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    
    CONSTRAINT unique_connection UNIQUE(user_id, connected_user_id),
    CONSTRAINT no_self_connection CHECK (user_id != connected_user_id)
);
```

### conversations Table

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    participant_1_id UUID NOT NULL,
    participant_2_id UUID NOT NULL,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    participant_1_unread_count INTEGER DEFAULT 0,
    participant_2_unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    
    CONSTRAINT unique_conversation UNIQUE(participant_1_id, participant_2_id)
);
```

## Security & Authorization

### Row Level Security (RLS)

**user_connections:**
- Users can only view connections they're part of
- Users can create requests where they're the sender
- Only the recipient can respond to requests
- Both parties can delete the connection

**conversations:**
- Users can only view conversations they're participants in
- Can only create conversations if connected
- Cannot create conversations with non-connected users

**messages:**
- Users can only view messages in their conversations
- Can only send messages if connected
- Can only edit/delete own messages

### Connection Validation

```typescript
// Before sending message
function are_users_connected(user1_id, user2_id): boolean {
  return EXISTS(
    SELECT 1 FROM user_connections
    WHERE status = 'accepted'
    AND (
      (user_id = user1_id AND connected_user_id = user2_id) OR
      (user_id = user2_id AND connected_user_id = user1_id)
    )
  );
}
```

## Frontend Integration

### Sending Connection Request

```typescript
import { connectionService } from '@/services/connection.service';

async function sendRequest(listenerId: string) {
  try {
    const connection = await connectionService.sendConnectionRequest(listenerId);
    console.log('Request sent:', connection);
    // Show success message
  } catch (error) {
    console.error('Failed:', error);
    // Show error message
  }
}
```

### Responding to Request

```typescript
async function respondToRequest(connectionId: string, accept: boolean) {
  try {
    const status = accept ? 'accepted' : 'rejected';
    const connection = await connectionService.respondToConnectionRequest(
      connectionId,
      status
    );
    console.log('Response sent:', connection);
    // Navigate to conversation if accepted
    if (accept) {
      router.push(`/messages/${connectionId}`);
    }
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

### Checking Connection Status

```typescript
async function checkStatus(userId: string) {
  const status = await connectionService.getConnectionStatus(userId);
  
  switch (status.status) {
    case 'none':
      // Show "Connect" button
      break;
    case 'pending_sent':
      // Show "Request Pending"
      break;
    case 'pending_received':
      // Show "Accept / Reject" buttons
      break;
    case 'connected':
      // Show "Message" button
      break;
  }
}
```

## Real-Time Updates

### Notifications

```typescript
import { notificationService } from '@/services/notification.service';

// Subscribe to real-time notifications
const unsubscribe = notificationService.subscribeToNotifications(
  (notification) => {
    if (notification.notification_type === 'connection_request') {
      // Show notification badge
      // Play notification sound
      // Update pending requests count
    } else if (notification.notification_type === 'connection_accepted') {
      // Show success message
      // Update connections list
    }
  }
);

// Clean up on unmount
return () => unsubscribe();
```

### Connection List Updates

```typescript
// Listen for connection changes
supabase
  .channel('connections')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_connections',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // Refresh connections list
    fetchConnections();
  })
  .subscribe();
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Connection request already exists" | Duplicate request | Check existing connections first |
| "Target user not found" | Invalid user ID | Validate user exists before request |
| "Not authenticated" | No auth session | Redirect to login |
| "Cannot send connection request to yourself" | Self-connection attempt | Add frontend validation |
| "Connection not found or you are not authorized" | Wrong recipient | Verify connection ownership |

### Preventing Duplicate Requests

```typescript
// Before showing "Connect" button
const status = await connectionService.getConnectionStatus(targetUserId);

if (status.status === 'none') {
  // Show "Connect" button
} else if (status.status === 'pending_sent') {
  // Show "Request Pending" (disabled)
} else if (status.status === 'connected') {
  // Show "Message" button
}
```

## Performance Considerations

### Indexes

```sql
CREATE INDEX idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX idx_user_connections_connected_user_id ON user_connections(connected_user_id);
CREATE INDEX idx_user_connections_status ON user_connections(status);
```

### Pagination

```typescript
// Load connections in batches
const { connections, total } = await connectionService.getConnections({
  status: 'accepted',
  page: 1,
  limit: 20,
});
```

### Caching

Consider caching:
- Connection status for frequently viewed profiles
- Pending request count
- Recent connections list

## Testing

### Manual Testing Checklist

- [ ] User can send connection request to listener
- [ ] Listener receives notification
- [ ] Listener can accept request
- [ ] User receives acceptance notification
- [ ] Conversation is auto-created
- [ ] Both parties can message each other
- [ ] Listener can reject request
- [ ] Cannot send duplicate requests
- [ ] Cannot connect to self
- [ ] Rejected requests don't create conversation
- [ ] Connection status updates in real-time

### Test Data

Create test connections:

```sql
-- Create connection request
INSERT INTO user_connections (
  user_id,
  connected_user_id,
  initiated_by,
  status
) VALUES (
  'user-uuid',
  'listener-uuid',
  'user-uuid',
  'pending'
);

-- Accept connection
UPDATE user_connections
SET 
  status = 'accepted',
  responded_at = NOW()
WHERE id = 'connection-uuid';
```

## Troubleshooting

### "Conversation not created after acceptance"

**Cause:** Trigger not installed or failed

**Solution:**
```bash
# Run the auto-create conversation script
psql -f AUTO_CREATE_CONVERSATION_ON_CONNECTION.sql
```

### "Cannot send messages after connecting"

**Cause:** RLS policy blocking or not connected

**Solution:**
```sql
-- Verify connection exists and is accepted
SELECT * FROM user_connections
WHERE status = 'accepted'
  AND (
    (user_id = 'user1' AND connected_user_id = 'user2') OR
    (user_id = 'user2' AND connected_user_id = 'user1')
  );

-- Verify conversation exists
SELECT * FROM conversations
WHERE (participant_1_id = 'user1' AND participant_2_id = 'user2')
   OR (participant_1_id = 'user2' AND participant_2_id = 'user1');
```

### "Notifications not received"

**Cause:** Notification not created or real-time subscription not active

**Solution:**
1. Check notifications table for created records
2. Verify Supabase Realtime is enabled
3. Check channel subscription in frontend
4. Verify notification service is properly initialized

## Future Enhancements

- [ ] Block/unblock functionality
- [ ] Connection request messages (attach personal note)
- [ ] Connection expiration (auto-reject after X days)
- [ ] Mutual friend suggestions
- [ ] Connection limits (prevent spam)
- [ ] Report abusive connection requests

## Related Documentation

- `MOCK_DATA_REMOVAL.md` - Real listener discovery
- Phase 5 - Listener-only chat actions
- Phase 6 - Internal support forms
- Phase 12 - Enhanced notifications

---

**Status:** ✅ Connection workflow fully implemented with notifications
