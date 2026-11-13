# Quick Fix Checklist: Listener Registration Issue

## Problem
✗ Listeners registered but showing as regular users  
✗ `account_type='user'` instead of `'listener'` in profiles table

## Solution: Run These 3 SQL Files

### □ Step 1: Fix Database Trigger
**File**: `FIX_PROFILE_CREATION_COMPLETE.sql`

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy **entire file** contents
3. Paste and click **Run**
4. Wait for success message

**What it fixes**: Profile creation with correct account_type

---

### □ Step 2: Add Availability Column
**File**: `FIX_LISTENERS_TABLE_SCHEMA.sql`

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy **entire file** contents
3. Paste and click **Run**
4. Wait for success message

**What it fixes**: Adds `is_available` column for real-time availability

---

### □ Step 3: Fix Existing Listeners
**File**: `FIX_EXISTING_LISTENER_ACCOUNTS.sql`

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy **entire file** contents
3. Paste and click **Run**
4. See report of fixed accounts

**What it fixes**: Updates already-registered listeners to have correct `account_type`

---

## Verify It Worked

Run this in Supabase SQL Editor:

```sql
SELECT 
  p.email,
  p.account_type,
  p.is_verified,
  l.professional_title
FROM profiles p
INNER JOIN listeners l ON p.id = l.user_id
ORDER BY p.created_at DESC;
```

**Expected**:
- ✅ `account_type` = 'listener' for all
- ✅ `is_verified` = true for verified listeners

---

## Test New Registration

1. Clear browser cookies
2. Go to listener registration
3. Register a new test listener
4. Check database:

```sql
SELECT account_type, is_verified
FROM profiles
WHERE email = 'your.test@example.com';
```

**Expected**: 
- account_type = 'listener' ✅
- is_verified = true ✅

---

## All Fixed? ✅

□ Step 1 SQL run  
□ Step 2 SQL run  
□ Step 3 SQL run  
□ Existing listeners show `account_type='listener'`  
□ New test registration works  
□ Listeners appear in discovery  
□ Badges show next to listener names  

**If all checked, you're done!** 🎉
