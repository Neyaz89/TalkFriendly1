# Developer Quick Reference Guide

## 🚀 Quick Start

### Install Dependencies
```bash
npm install @tanstack/react-query
```

### Run Type Check
```bash
npm run type-check
```

### Build for Production
```bash
npm run build
```

---

## 📖 Using Query Hooks

### Basic Usage

```typescript
import { useConversations } from '@/hooks/useConversations';

function MyComponent() {
  const { data, isLoading, error } = useConversations();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  
  return <ConversationList conversations={data} />;
}
```

### With Parameters

```typescript
import { useMessages } from '@/hooks/useMessages';

function ChatComponent({ conversationId }: { conversationId: string }) {
  const { data: messages, isLoading } = useMessages(conversationId);
  
  // Messages are cached - instant on subsequent renders
  return <MessageList messages={messages} />;
}
```

### Mutations with Optimistic Updates

```typescript
import { useSendMessage } from '@/hooks/useMessages';

function ChatInput({ conversationId }: { conversationId: string }) {
  const sendMessage = useSendMessage();
  
  const handleSend = async (text: string) => {
    // Message appears instantly, then confirms
    await sendMessage.mutateAsync({
      conversation_id: conversationId,
      content: text,
      message_type: 'text',
    });
  };
  
  return (
    <button 
      onClick={() => handleSend('Hello!')}
      disabled={sendMessage.isPending}
    >
      {sendMessage.isPending ? 'Sending...' : 'Send'}
    </button>
  );
}
```

---

## 🔑 Available Hooks

### Conversations
```typescript
import {
  useConversations,           // Get all conversations
  useConversation,            // Get single conversation
  useUnreadCount,             // Get unread message count
  useCreateConversation,      // Create/get conversation
  useDeleteConversation,      // Delete conversation
  useConversationSubscription // Real-time updates
} from '@/hooks/useConversations';
```

### Messages
```typescript
import {
  useMessages,                // Get messages (with cache)
  useInfiniteMessages,        // Infinite scroll support
  useSendMessage,             // Send with optimistic update
  useMarkMessagesRead,        // Mark as read
  useDeleteMessage,           // Delete message
  useMessageSubscription      // Real-time updates
} from '@/hooks/useMessages';
```

### Profile
```typescript
import {
  useCurrentProfile,          // Current user profile
  useUserProfile,             // Other user's profile
  useProfileStats,            // Stats (journals, moods, streak)
  useUpdateProfile,           // Update settings
  useUpdateProfileInfo        // Update info (name, bio, etc.)
} from '@/hooks/useProfile.enhanced';
```

### Connections
```typescript
import {
  useConnections,             // Get all connections
  useConnectionRequests,      // Pending requests
  useConnectionSearch,        // Search users
  useSendConnectionRequest,   // Send request
  useRespondToConnectionRequest, // Accept/reject
  useRemoveConnection         // Remove connection
} from '@/hooks/useConnections';
```

### Notifications
```typescript
import {
  useNotifications,           // All notifications
  useUnreadNotificationsCount, // Unread count
  useMarkNotificationRead,    // Mark single as read
  useMarkAllNotificationsRead, // Mark all as read
  useDeleteNotification       // Delete notification
} from '@/hooks/useNotifications';
```

### Dashboard
```typescript
import {
  useDashboardStats,          // Dashboard statistics
  useRecentActivity           // Recent activity feed
} from '@/hooks/useDashboard';
```

---

## 🎯 Cache Management

### Invalidate Queries
```typescript
import { invalidateQueries } from '@/lib/react-query';

// After updating data
await updateProfile(data);
invalidateQueries.profile(); // Refetch profile

// After sending message
await sendMessage(data);
invalidateQueries.conversations(); // Update conversation list
```

### Manual Cache Access
```typescript
import { queryClient, queryKeys } from '@/lib/react-query';

// Get cached data
const cachedConversations = queryClient.getQueryData(
  queryKeys.conversations.list()
);

// Set cache data
queryClient.setQueryData(
  queryKeys.conversations.list(),
  newConversations
);

// Remove from cache
queryClient.removeQueries({
  queryKey: queryKeys.conversations.all
});
```

---

## 🔒 Secure Logout Pattern

### Usage in Components
```typescript
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogoutConfirmDialog } from '@/components/common/LogoutConfirmDialog';

function MyComponent() {
  const { signOut } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogoutConfirm = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  return (
    <>
      <button onClick={() => setShowLogoutDialog(true)}>
        Log Out
      </button>
      
      <LogoutConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
}
```

---

## 🎨 Styling Guidelines

### Use Existing Brand Colors
```typescript
// ✅ Good - Use existing Tailwind classes
<div className="bg-primary text-white" />
<div className="text-muted" />
<div className="border-border" />

// ❌ Avoid - Don't introduce new colors
<div className="bg-blue-500" />
```

### Consistent Spacing
```typescript
// ✅ Good - Use spacing scale
<div className="p-4 gap-3 space-y-6" />

// ❌ Avoid - Arbitrary values
<div className="p-[13px] gap-[11px]" />
```

### Card Components
```typescript
// ✅ Good - Use card classes
<div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6" />

// Or use the card-base utility
<div className="card-base p-6" />
```

---

## 📱 Responsive Design

### Mobile-First Approach
```typescript
// ✅ Good - Mobile first, then larger screens
<div className="flex flex-col md:flex-row gap-4 md:gap-6" />

// ❌ Avoid - Desktop first
<div className="flex-row md:flex-col" />
```

### Touch Targets
```typescript
// ✅ Good - Minimum 44x44px for touch
<button className="h-12 px-4 rounded-xl" />

// ❌ Avoid - Too small for touch
<button className="h-6 px-2" />
```

---

## ♿ Accessibility

### ARIA Labels
```typescript
// ✅ Good
<button aria-label="Close dialog" onClick={onClose}>
  <X className="h-5 w-5" />
</button>

// ❌ Avoid - No label for icon-only button
<button onClick={onClose}>
  <X className="h-5 w-5" />
</button>
```

### Keyboard Navigation
```typescript
// ✅ Good - Keyboard accessible
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>
```

---

## 🧪 Testing Patterns

### Test with Loading States
```typescript
function MyComponent() {
  const { data, isLoading, error } = useConversations();
  
  // Always handle loading
  if (isLoading) return <LoadingSpinner />;
  
  // Always handle errors
  if (error) return <ErrorMessage error={error} />;
  
  // Then render data
  return <ConversationList conversations={data} />;
}
```

### Test Optimistic Updates
```typescript
const sendMessage = useSendMessage();

// Check pending state
if (sendMessage.isPending) {
  // Show loading indicator
}

// Check error
if (sendMessage.error) {
  // Show error message
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Cache not updating after mutation
```typescript
// ❌ Problem - Forgetting to invalidate
const updateProfile = useMutation({
  mutationFn: profileService.updateProfile,
  // Missing onSuccess
});

// ✅ Solution - Invalidate related queries
const updateProfile = useMutation({
  mutationFn: profileService.updateProfile,
  onSuccess: () => {
    queryClient.invalidateQueries({ 
      queryKey: queryKeys.profile.current 
    });
  },
});
```

### Issue: Stale data showing
```typescript
// ❌ Problem - staleTime too long
useQuery({
  queryKey: ['myData'],
  queryFn: fetchData,
  staleTime: Infinity, // Never refetches!
});

// ✅ Solution - Appropriate staleTime
useQuery({
  queryKey: ['myData'],
  queryFn: fetchData,
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

### Issue: Real-time updates causing duplicates
```typescript
// ❌ Problem - Adding without checking
useEffect(() => {
  const subscription = subscribeToMessages((newMessage) => {
    setMessages(prev => [...prev, newMessage]); // Duplicate!
  });
}, []);

// ✅ Solution - Check for existence
useEffect(() => {
  const subscription = subscribeToMessages((newMessage) => {
    queryClient.setQueryData(queryKey, (old) => {
      const exists = old?.find(m => m.id === newMessage.id);
      if (exists) return old;
      return [...(old || []), newMessage];
    });
  });
}, []);
```

---

## 📦 File Structure

```
src/
├── lib/
│   └── react-query.ts              # Query client config
├── hooks/
│   ├── useConversations.ts         # Conversation hooks
│   ├── useMessages.ts              # Message hooks
│   ├── useProfile.enhanced.ts      # Profile hooks
│   ├── useConnections.ts           # Connection hooks
│   ├── useNotifications.ts         # Notification hooks
│   └── useDashboard.ts             # Dashboard hooks
├── components/
│   ├── providers/
│   │   └── QueryClientProvider.tsx # Query provider
│   └── common/
│       └── LogoutConfirmDialog.tsx # Logout dialog
├── features/
│   ├── chat/
│   │   ├── ChatView.tsx            # With caching
│   │   └── ChatInterface.tsx       # With caching
│   ├── profile/
│   │   └── ProfileDisplayView.tsx  # Redesigned
│   └── settings/
│       └── SettingsView.tsx        # With logout confirm
└── contexts/
    └── AuthContext.tsx             # Enhanced with cache clearing
```

---

## 🎓 Best Practices

### 1. Always Use Query Hooks for Data Fetching
```typescript
// ✅ Good - Use hooks with caching
const { data } = useConversations();

// ❌ Avoid - Direct API calls without caching
const data = await conversationService.getConversations();
```

### 2. Handle All States
```typescript
// ✅ Good - Complete state handling
function MyComponent() {
  const { data, isLoading, error, refetch } = useMyData();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage onRetry={refetch} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
}
```

### 3. Use Optimistic Updates for Better UX
```typescript
// ✅ Good - Optimistic updates
const mutation = useMutation({
  mutationFn: sendMessage,
  onMutate: async (newMessage) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(queryKey);
    
    // Optimistically update
    queryClient.setQueryData(queryKey, old => [...old, newMessage]);
    
    return { previous };
  },
  onError: (err, newMessage, context) => {
    // Rollback on error
    queryClient.setQueryData(queryKey, context.previous);
  },
});
```

### 4. Invalidate Related Queries
```typescript
// ✅ Good - Invalidate related data
const updateProfile = useMutation({
  mutationFn: profileService.update,
  onSuccess: () => {
    invalidateQueries.profile();
    invalidateQueries.connections(); // Profile affects connections
  },
});
```

### 5. Clear Caches on Logout
```typescript
// ✅ Good - Already implemented in AuthContext
const signOut = async () => {
  await supabase.auth.signOut();
  
  const { clearAllCaches } = await import('@/lib/react-query');
  clearAllCaches();
  
  // Clear local storage
  const theme = localStorage.getItem('theme');
  localStorage.clear();
  if (theme) localStorage.setItem('theme', theme);
};
```

---

## 🔍 Debugging Tips

### Check Cache Contents
```typescript
// In browser console or component
import { queryClient, queryKeys } from '@/lib/react-query';

// View all cached queries
console.log(queryClient.getQueryCache().getAll());

// View specific cache
console.log(
  queryClient.getQueryData(queryKeys.conversations.list())
);
```

### Use React Query DevTools
Already configured! Press the floating button in development mode to:
- View all queries and their states
- See cache contents
- Manually refetch or invalidate
- Monitor query performance

### Debug Real-time Sync
```typescript
// Add logging to subscription
useEffect(() => {
  const unsubscribe = subscribeToMessages((newMessage) => {
    console.log('📨 New message received:', newMessage);
    // Update cache
  });
  
  return unsubscribe;
}, []);
```

---

## 📚 Further Reading

- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [Optimistic Updates Guide](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [Caching Examples](https://tanstack.com/query/latest/docs/react/guides/caching)
- [Mutations Guide](https://tanstack.com/query/latest/docs/react/guides/mutations)

---

**Last Updated:** 2026-11-12  
**Version:** 1.0.0
