# Fix: Listeners Being Registered as Regular Users

## Problem

Users registering as listeners are being created with `account_type='user'` instead of `account_type='listener'` in the profiles table.

## Root Causes

1. **Database trigger not applied** - The `handle_new_user()` trigger needs to read `account_type` from signup metadata
2. **Listener setup API not updating profile** - The `/api/listener/setup` endpoint wasn't explicitly setting `account_type='listener'` in profiles table

## Solutions Applied

### Fix 1: Updated Listener Setup API ✅

**File**: `src/app/api/listener/setup/route.ts`

Changed to explicitly update `account_type` in profiles:

```typescript
// Now updates account_type to 'listener'
await supabase
  .from('profiles')
  .update({ 
    is_verified: true,
    account_type: 'listener'  // ← Added this
  })
  .eq('id', user.id);
```

### Fix 2: Database Trigger (Must Apply)

**File**: `FIX_PROFILE_CREATION_COMPLETE.sql`

This trigger reads `account_type` from signup metadata:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
...
  account_type = COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')
  -- ← Reads account_type from metadata
...
```

### Fix 3: Fix Existing Listener Accounts

**File**: `FIX_EXISTING_LISTENER_ACCOUNTS.sql`

Updates profiles for users who already registered as listeners.

---

## Step-by-Step Fix Guide

### Step 1: Apply Database Trigger (Required)

If you haven't already, run this in **Supabase SQL Editor**:

1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `FIX_PROFILE_CREATION_COMPLETE.sql`
3. Paste and click **Run**

**What it does**:
- Updates the `handle_new_user()` function to include `account_type`
- Reads `account_type` from signup metadata
- Creates profiles with correct `account_type` from the start

### Step 2: Fix Existing Listener Accounts

Run this in **Supabase SQL Editor**:

1. Copy entire contents of `FIX_EXISTING_LISTENER_ACCOUNTS.sql`
2. Paste and click **Run**

**What it does**:
- Finds users who have listener records but `account_type='user'`
- Updates their profiles to `account_type='listener'`
- Marks verified listeners with `is_verified=true`
- Shows a report of all fixed accounts

### Step 3: Apply Listeners Table Schema (If Not Done)

Run this in **Supabase SQL Editor**:

1. Copy entire contents of `FIX_LISTENERS_TABLE_SCHEMA.sql`
2. Paste and click **Run**

**What it does**:
- Adds `is_available` column for real-time availability
- Adds `accepts_new_patients` column

---

## Verification

### Check 1: Verify Trigger Is Applied

```sql
-- In Supabase SQL Editor
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Should show 'account_type' in the function body
```

### Check 2: Check Existing Listener Accounts

```sql
-- In Supabase SQL Editor
SELECT 
  p.id,
  p.email,
  p.account_type,
  p.is_verified,
  l.verification_status,
  l.professional_title
FROM profiles p
INNER JOIN listeners l ON p.id = l.user_id;

-- account_type should be 'listener' for all
```

### Check 3: Test New Registration

1. Register a new listener through the form
2. Check the profiles table:

```sql
SELECT id, email, account_type, is_verified
FROM profiles
WHERE email = 'your.test.email@example.com';

-- account_type should be 'listener'
-- is_verified should be 'true' (if auto_verify is enabled)
```

---

## What Each SQL File Does

| File | Purpose | When to Run |
|------|---------|-------------|
| `FIX_PROFILE_CREATION_COMPLETE.sql` | Fixes the database trigger to read account_type | **Required** - Run once |
| `FIX_LISTENERS_TABLE_SCHEMA.sql` | Adds is_available column | **Required** - Run once |
| `FIX_EXISTING_LISTENER_ACCOUNTS.sql` | Fixes already-registered listeners | **Run if you have existing listeners** |

---

## Expected Behavior After Fix

### For New Listener Registrations:

1. User fills out listener registration form
2. Supabase auth creates user with metadata: `{ account_type: 'listener', ... }`
3. **Trigger creates profile** with `account_type='listener'` ✅
4. `/api/listener/setup` creates listener record
5. **Profile is updated** to ensure `account_type='listener'` and `is_verified=true` ✅

### Result:
```sql
profiles table:
  account_type: 'listener' ✅
  is_verified: true ✅

listeners table:
  verification_status: 'verified' ✅
  is_available: true ✅
```

---

## Troubleshooting

### Issue: Trigger applied but still creating as 'user'

**Check auth metadata**:
```sql
SELECT raw_user_meta_data 
FROM auth.users 
WHERE email = 'test@example.com';

-- Should show: { "account_type": "listener", ... }
```

**If metadata is missing**:
- The frontend is not passing account_type correctly
- Check SimplifiedListenerForm.tsx line 69-75

### Issue: Existing listeners not fixed

**Manually update a specific user**:
```sql
UPDATE profiles 
SET account_type = 'listener', is_verified = true
WHERE email = 'listener@example.com';
```

### Issue: Listeners don't appear in discovery

**Check if they meet all criteria**:
```sql
SELECT 
  l.name,
  l.verification_status,
  l.accepts_new_patients,
  l.is_available,
  p.account_type
FROM listeners l
INNER JOIN profiles p ON l.user_id = p.id;

-- All should be:
-- verification_status = 'verified'
-- accepts_new_patients = true  
-- is_available = true
-- account_type = 'listener'
```

---

## Summary

✅ **Code fixed** - Listener setup API now explicitly sets `account_type='listener'`  
⚠️ **Database trigger** - YOU MUST run `FIX_PROFILE_CREATION_COMPLETE.sql`  
⚠️ **Existing accounts** - YOU MUST run `FIX_EXISTING_LISTENER_ACCOUNTS.sql` to fix already-registered listeners  
⚠️ **Table schema** - YOU MUST run `FIX_LISTENERS_TABLE_SCHEMA.sql` to add `is_available` column

**After running all three SQL files:**
- ✅ New listeners will be created correctly
- ✅ Existing listeners will be fixed
- ✅ Listeners will appear in discovery with badges
- ✅ Real-time availability tracking enabled

---

## Quick Check: Are My Listeners Fixed?

Run this query in Supabase:

```sql
SELECT 
  COUNT(*) FILTER (WHERE p.account_type = 'listener') as correct_listeners,
  COUNT(*) FILTER (WHERE p.account_type = 'user') as wrong_listeners,
  COUNT(*) as total_listeners
FROM listeners l
INNER JOIN profiles p ON l.user_id = p.id;
```

**Expected Result**:
- `correct_listeners`: (number) ✅
- `wrong_listeners`: 0 ✅
- `total_listeners`: (total)

If `wrong_listeners` > 0, run `FIX_EXISTING_LISTENER_ACCOUNTS.sql`!
