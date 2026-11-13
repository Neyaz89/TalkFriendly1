# Fix: Listener Registration Issues

## Problems Identified

### 1. Profile Creation RLS Violation
**Error**: `new row violates row-level security policy for table "profiles"`

**Cause**: The API route tries to manually insert a profile after signup, but RLS policies require `auth.uid() = id`. However, the trigger context doesn't have proper authentication.

**Solution**: 
- ✅ Let the database trigger handle profile creation (it runs as `SECURITY DEFINER`)
- ✅ Updated trigger to include `account_type` field
- ✅ Removed manual profile insert from API route

### 2. Listener Setup 401 Unauthorized
**Error**: `POST /api/listener/setup 401`

**Cause**: User session is not properly established after registration.

**Possible Reasons**:
1. Email confirmation is enabled in Supabase (user needs to confirm email first)
2. Session cookies not being set properly
3. Client-side code calling `/api/listener/setup` before auth state updates

## Fixes Applied

### Fix 1: Database Trigger (Apply SQL)

Run `FIX_PROFILE_CREATION_COMPLETE.sql` in Supabase SQL Editor:

```sql
-- This fixes:
-- ✅ Adds account_type to profile creation
-- ✅ Uses SECURITY DEFINER to bypass RLS
-- ✅ Handles duplicates with ON CONFLICT
-- ✅ Updates RLS policies
```

### Fix 2: Registration API Route

Updated `/api/auth/register` to:
- ✅ Remove manual profile insertion
- ✅ Let trigger handle it automatically
- ✅ Simplified code

### Fix 3: Client-Side Registration Flow

The client needs to wait for authentication before calling listener setup:

```typescript
// ❌ WRONG - Don't do this
const response = await fetch('/api/auth/register', { ... });
await fetch('/api/listener/setup', { ... }); // ⚠️ Not authenticated yet!

// ✅ CORRECT - Wait for auth state
const response = await fetch('/api/auth/register', { ... });

// Wait for Supabase to update auth state
await new Promise(resolve => setTimeout(resolve, 1000));

// Or better: wait for auth state change
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  await fetch('/api/listener/setup', { ... }); // ✅ Now authenticated
}
```

## Deployment Steps

### Step 1: Apply Database Fix

```bash
# In Supabase SQL Editor, run:
FIX_PROFILE_CREATION_COMPLETE.sql
```

### Step 2: Code is Already Fixed

The following files have been updated:
- ✅ `src/app/api/auth/register/route.ts` - Removed manual profile insert

### Step 3: Check Supabase Email Confirmation

In Supabase Dashboard:
1. Go to **Authentication** → **Settings**
2. Check **Email Auth** section
3. Look for "**Enable email confirmations**"

**If ENABLED**:
- Users must confirm email before they can authenticate
- Registration returns success, but user can't login until confirmed
- Solution: Disable for development, or handle confirmation flow

**If DISABLED**:
- Users are auto-confirmed
- Should work immediately after registration

### Step 4: Test Registration Flow

1. **Test User Registration**:
```bash
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "password123",
  "username": "testuser",
  "fullName": "Test User",
  "accountType": "user"
}
```

Expected: ✅ 200 OK, profile auto-created by trigger

2. **Test Listener Registration**:
```bash
# Step 1: Register
POST /api/auth/register
{
  "email": "listener@example.com",
  "password": "password123",
  "username": "listener1",
  "fullName": "Test Listener",
  "accountType": "listener"
}

# Step 2: Wait for auth state (1 second)

# Step 3: Setup listener profile
POST /api/listener/setup
{
  "full_legal_name": "Test Listener",
  "email": "listener@example.com",
  "country": "USA",
  "city": "New York",
  "professional_title": "Mental Health Counselor",
  "years_of_experience": 5,
  "specialization": ["anxiety", "depression"],
  "professional_bio": "Experienced counselor...",
  "auto_verify": true
}
```

Expected: ✅ 200 OK, listener profile created

## Verification Queries

After applying fixes, run these in Supabase SQL Editor to verify:

```sql
-- 1. Check trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check function includes account_type
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Test profile creation (after registering a test user)
SELECT id, username, email, account_type, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
```

## Common Issues & Solutions

### Issue: Still getting 401 on listener setup

**Solution 1**: Check if email confirmation is required
```sql
-- In Supabase dashboard, disable email confirmation for testing
-- Authentication → Settings → Email Auth → Disable "Enable email confirmations"
```

**Solution 2**: Add delay in client code
```typescript
// After registration, wait for auth state
await new Promise(resolve => setTimeout(resolve, 1500));
```

**Solution 3**: Check if cookies are being set
```typescript
// In browser DevTools → Application → Cookies
// Look for: sb-<project-ref>-auth-token
```

### Issue: Profile created but account_type is NULL

**Solution**: Re-run the migration to update the trigger
```bash
psql -f FIX_PROFILE_CREATION_COMPLETE.sql
```

### Issue: Duplicate key error on profiles

**Solution**: Trigger includes ON CONFLICT now
```sql
-- If still failing, manually handle duplicates:
INSERT INTO profiles (...) 
VALUES (...) 
ON CONFLICT (id) DO UPDATE SET ...;
```

## Summary

✅ **Database trigger fixed** - Auto-creates profiles with account_type  
✅ **API route simplified** - No manual profile insertion  
✅ **RLS policies updated** - Proper permissions for trigger  
✅ **Client flow documented** - Wait for auth before setup  

**Next Steps**:
1. Apply `FIX_PROFILE_CREATION_COMPLETE.sql` in Supabase
2. Test user registration
3. Test listener registration with 1-second delay
4. Check Supabase email confirmation settings
5. Monitor logs for any remaining errors

## Support

If issues persist:
1. Check Supabase logs (Dashboard → Logs)
2. Check browser console for errors
3. Verify trigger is running: `SELECT * FROM pg_stat_user_functions WHERE funcname = 'handle_new_user';`
4. Check if RLS is blocking: Temporarily disable RLS for testing
