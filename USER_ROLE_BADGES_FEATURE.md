# User Role Badge System

## Overview

Added visual indicators (icons/badges) to differentiate between users, listeners, doctors, and admins throughout the application.

## Visual Indicators

| Role | Icon | Color | When Shown |
|------|------|-------|------------|
| **Regular User** | None | - | No badge (default) |
| **Verified Listener** | ✓ Checkmark | Green | account_type='listener' + is_verified=true |
| **Unverified Listener** | 🩺 Stethoscope | Blue | account_type='listener' + is_verified=false |
| **Doctor** | 🩺 Stethoscope (filled) | Purple | account_type='doctor' |
| **Admin** | ✓ Checkmark | Red | account_type='admin' |

## Component Created

### `src/components/ui/user-role-badge.tsx`

Reusable component for displaying role badges:

```typescript
<UserRoleBadge 
  accountType="listener"
  isVerified={true}
  size="sm"       // sm | md | lg
  showLabel={false}  // Show text label
  className=""    // Optional custom classes
/>
```

**Props**:
- `accountType`: 'user' | 'listener' | 'doctor' | 'admin'
- `isVerified`: boolean (only for listeners)
- `size`: 'sm' | 'md' | 'lg' (default: 'sm')
- `showLabel`: boolean (show text alongside icon)
- `className`: string (additional CSS classes)

## Where Badges Are Displayed

### 1. Chat Messages ✅
**File**: `src/features/chat/ChatMessage.tsx`

```tsx
// Badge appears next to sender name above message bubble
<span className="flex items-center gap-1.5">
  <span>John Doe</span>
  <UserRoleBadge accountType="listener" isVerified={true} size="sm" />
</span>
```

**What users see**:
- Regular users: "John Doe"
- Verified listeners: "Jane Smith ✓" (green checkmark)
- Doctors: "Dr. Brown 🩺" (purple stethoscope)

### 2. Listener Cards ✅
**File**: `src/features/dashboard/RecommendedListenerCard.tsx`

```tsx
// Badge appears next to listener name on card
<div className="flex items-center gap-1.5">
  <p className="font-semibold">Dr. Sarah Johnson</p>
  <UserRoleBadge accountType="listener" isVerified={true} size="sm" />
</div>
```

### 3. Listener Profile ✅
**File**: `src/features/listeners/ListenerProfileView.tsx`

```tsx
// Badge appears next to name in hero section
<div className="flex items-center gap-2">
  <h2 className="text-xl font-bold">Dr. Sarah Johnson</h2>
  <UserRoleBadge accountType="listener" isVerified={true} size="md" />
</div>
```

### 4. Other Places to Add (Future)

**Connection Requests**:
```tsx
// src/features/connections/ConnectionRequestCard.tsx
<UserRoleBadge accountType={user.account_type} isVerified={user.is_verified} />
```

**User Search Results**:
```tsx
// src/features/search/UserSearchResult.tsx
<UserRoleBadge accountType={result.account_type} isVerified={result.is_verified} />
```

**Notification Items**:
```tsx
// src/features/notifications/NotificationItem.tsx
<UserRoleBadge accountType={actor.account_type} isVerified={actor.is_verified} />
```

**Profile Views**:
```tsx
// src/features/profile/ProfileDisplayView.tsx
<UserRoleBadge accountType={profile.account_type} isVerified={profile.is_verified} />
```

## Icon Meanings

### Checkmark (✓) - Verified Status
- **Green Checkmark**: Verified Listener (professional credentials confirmed)
- **Red Checkmark**: Admin (platform administrator)

### Stethoscope (🩺) - Medical Professional
- **Blue Stethoscope**: Listener (not yet verified or verification not required)
- **Purple Stethoscope (filled)**: Doctor (medical professional)

### No Icon - Regular User
- Regular users don't get a badge by default
- Keeps UI clean and makes professionals stand out

## Usage Examples

### Example 1: Chat Interface

```tsx
// In ChatMessage component
{!isOwnMessage && (
  <span className="flex items-center gap-1.5">
    <span>{sender?.full_name || 'User'}</span>
    <UserRoleBadge 
      accountType={sender?.account_type}
      isVerified={sender?.is_verified}
      size="sm"
    />
  </span>
)}
```

**Result**:
- User message: "Alice Johnson"
- Listener message: "Bob Smith ✓" (green checkmark)
- Doctor message: "Dr. Chen 🩺" (purple stethoscope)

### Example 2: Listener Discovery

```tsx
// In listener card
<div className="flex items-center gap-1.5">
  <h3>{listener.name}</h3>
  <UserRoleBadge 
    accountType="listener"
    isVerified={listener.isVerified}
    size="sm"
  />
</div>
```

**Result**:
- Verified listener: "Sarah Johnson ✓"
- Unverified listener: "Mike Brown 🩺"

### Example 3: With Label

```tsx
<UserRoleBadge 
  accountType="listener"
  isVerified={true}
  size="md"
  showLabel={true}  // Show text alongside icon
/>
```

**Result**: "✓ Verified Listener" (icon + text)

## Database Fields Required

The badge system uses these profile fields:

```typescript
{
  account_type: 'user' | 'listener' | 'doctor' | 'admin',
  is_verified: boolean  // Only for listeners/doctors
}
```

Ensure these fields are populated:
- `profiles.account_type` - Set during registration
- `profiles.is_verified` - Set when listener is verified
- OR `listeners.verification_status === 'verified'`

## Customization

### Change Colors

Edit `src/components/ui/user-role-badge.tsx`:

```typescript
// Listener verified (currently green)
'text-green-600 dark:text-green-400'

// Listener unverified (currently blue)
'text-blue-600 dark:text-blue-400'

// Doctor (currently purple)
'text-purple-600 dark:text-purple-400'

// Admin (currently red)
'text-red-600 dark:text-red-400'
```

### Change Icons

```typescript
import { CheckCircle, Stethoscope, Shield, Star } from 'lucide-react';

// Use different icons:
<Shield className={iconSize} />  // For admin
<Star className={iconSize} />    // For premium users
```

### Add New Roles

```typescript
// Add to UserRoleBadge component
if (accountType === 'premium_user') {
  return (
    <span className="text-gold-600">
      <Star className={iconSize} />
      {showLabel && <span>Premium</span>}
    </span>
  );
}
```

## Accessibility

Badges include proper ARIA labels:

```tsx
<span title="Verified Listener">  {/* Tooltip on hover */}
  <CheckCircle aria-label="Verified listener" />
</span>
```

Screen readers will announce: "Verified Listener" when encountering the badge.

## Benefits

✅ **Instant Recognition** - Users can immediately identify listeners vs regular users  
✅ **Trust Building** - Verified checkmark increases credibility  
✅ **Professional Distinction** - Stethoscope icon highlights medical professionals  
✅ **Consistent UI** - Same badge appears everywhere (chat, profiles, cards)  
✅ **Lightweight** - No extra API calls, uses existing user data  
✅ **Responsive** - Three sizes (sm, md, lg) adapt to different contexts  

## Testing

### Manual Testing

1. **Chat as Regular User**:
   - Your messages: No badge
   - Listener messages: Should show ✓ or 🩺

2. **View Listener Profile**:
   - Verified listener: Green ✓ next to name
   - Unverified listener: Blue 🩺 next to name

3. **Browse Listener Cards**:
   - All listeners should show appropriate badge

### Visual Test Cases

| Scenario | Expected Badge |
|----------|----------------|
| Regular user in chat | None |
| Verified listener in chat | Green ✓ |
| Unverified listener in chat | Blue 🩺 |
| Doctor in chat | Purple 🩺 |
| Admin in chat | Red ✓ |
| Listener card (verified) | Green ✓ |
| Listener profile header | Green ✓ |

## Future Enhancements

### 1. Animated Badges

```tsx
<motion.span
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  className="inline-block"
>
  <UserRoleBadge ... />
</motion.span>
```

### 2. Badge Tooltips

```tsx
<Tooltip content="Verified professional with 5+ years experience">
  <UserRoleBadge ... />
</Tooltip>
```

### 3. Premium User Badges

```typescript
// Add premium tier badges
if (user.isPremium) {
  return <Star className="text-gold-500" />;
}
```

### 4. Custom Listener Badges

```typescript
// Based on ratings, sessions, etc.
if (listener.rating >= 4.9) {
  return <Badge variant="gold">Top Rated</Badge>;
}
```

## Summary

✅ **Component created**: `src/components/ui/user-role-badge.tsx`  
✅ **Chat messages updated**: Shows badge next to sender name  
✅ **Listener cards updated**: Shows badge next to listener name  
✅ **Profile views updated**: Shows badge in hero section  
✅ **Reusable**: Can be added anywhere user/listener names appear  
✅ **Accessible**: Proper ARIA labels and tooltips  
✅ **Responsive**: Three sizes (sm, md, lg)  
✅ **Themeable**: Supports light/dark mode  

Users can now instantly distinguish between regular users, listeners, doctors, and admins throughout the app! 🎉
