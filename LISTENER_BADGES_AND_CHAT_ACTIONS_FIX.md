# Listener Badges and Chat Actions - Final Fix

## Summary
Fixed missing import and profile data fetching to enable listener badges and chat actions throughout the application.

## Changes Made

### 1. ChatInterface.tsx - Added Missing Import
**File**: `src/features/chat/ChatInterface.tsx`

**Problem**: The `useAuth` hook was being used but not imported, causing a runtime error.

**Fix**: Added the import statement:
```typescript
import { useAuth } from "@/contexts/AuthContext";
```

This allows ChatInterface to:
- Access the logged-in user's profile
- Check if user is a listener (`profile?.account_type === 'listener'`)
- Show ListenerChatActions buttons only to listeners

### 2. ProfileDisplayView.tsx - Added Badge Support
**File**: `src/features/profile/ProfileDisplayView.tsx`

**Changes**:
1. Added `UserRoleBadge` import
2. Updated Profile interface to include:
   - `account_type?: 'user' | 'listener' | 'doctor' | 'admin'`
   - `is_verified?: boolean`
3. Added badge next to user's name in profile header:
```tsx
{profile?.account_type && profile.account_type !== 'user' && (
  <UserRoleBadge
    accountType={profile.account_type}
    isVerified={profile.is_verified}
    size="lg"
  />
)}
```

### 3. Profile Page - Fetch Required Fields
**File**: `src/app/(app)/profile/page.tsx`

**Problem**: Profile query was using `select('*')` which might not include custom fields consistently.

**Fix**: Explicitly select required fields including account_type and is_verified:
```typescript
.select('id, username, full_name, email, profession, avatar_url, bio, created_at, account_type, is_verified')
```

## Where Badges Appear

### ✅ Already Working (from previous session):
1. **Chat Messages** - Shows badge next to sender name
2. **Recommended Listener Cards** - Shows badge next to listener name  
3. **Listener Profile View** - Shows badge in hero section

### ✅ Fixed Now:
4. **User Profile Page** - Shows badge next to user's name (for listeners only)
5. **Chat Interface** - Properly loads profile to show ListenerChatActions

## Badge Types

| User Type | Badge | Color | Icon |
|-----------|-------|-------|------|
| Regular User | None | - | - |
| Unverified Listener | Blue | 🩺 Stethoscope | Outline |
| Verified Listener | Green | ✓ CheckCircle | Filled |
| Doctor | Purple | 🩺 Stethoscope | Filled |
| Admin | Red | ✓ CheckCircle | Filled |

## Listener Chat Actions

The `ListenerChatActions` component shows a dropdown menu with:
- **Send Support Form** - Send assessment/intake forms to clients
- **Request Feedback** - Request session feedback from clients

**Visibility**: Only shown when `profile.account_type === 'listener'`

## Testing Instructions

### To verify badges are working:

1. **Log in as a listener** (account with `account_type='listener'` in profiles table)

2. **Check Profile Page**:
   - Go to `/profile`
   - Badge should appear next to your name at the top

3. **Check Chat**:
   - Go to `/messages` 
   - Open a conversation
   - Badge should appear next to message sender names (if they're listeners)
   - "Listener Actions" button should appear in chat header (top right)

4. **Check Listener Cards**:
   - Go to main dashboard or listener discovery page
   - Badge should appear on listener cards

### If badges still don't show:

1. **Clear browser cache and hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check browser console** for any errors
3. **Verify database**:
   ```sql
   SELECT id, username, full_name, account_type, is_verified 
   FROM profiles 
   WHERE account_type = 'listener';
   ```
4. **Check AuthContext** - Make sure it's loading profile with account_type

## Database Requirements

The `profiles` table must have:
- `account_type` column (text or enum: 'user', 'listener', 'doctor', 'admin')
- `is_verified` column (boolean)

Applied in previous session via:
- `FIX_PROFILE_CREATION_COMPLETE.sql`
- `FIX_EXISTING_LISTENER_ACCOUNTS.sql`

## Component Structure

```
ChatInterface (uses profile from AuthContext)
├── ChatMessage (shows UserRoleBadge for each message sender)
└── ListenerChatActions (shows only if isListener=true)
    ├── Send Support Form
    └── Request Feedback

ProfileDisplayView (receives profile with account_type)
└── UserRoleBadge (shows if account_type !== 'user')

ListenerProfileView
└── UserRoleBadge (shows for listener profiles)

RecommendedListenerCard
└── UserRoleBadge (shows for each listener)
```

## Files Modified

1. `src/features/chat/ChatInterface.tsx` - Added useAuth import
2. `src/features/profile/ProfileDisplayView.tsx` - Added badge display
3. `src/app/(app)/profile/page.tsx` - Added account_type/is_verified to query

## Next Steps

1. **Refresh the page** to see changes take effect
2. **Log in as a listener account** to test
3. **Send a message in chat** to verify badge appears
4. **Visit profile page** to see badge on profile

If issues persist, check:
- Browser console for errors
- Network tab for failed API requests
- Database to confirm account_type is set correctly
