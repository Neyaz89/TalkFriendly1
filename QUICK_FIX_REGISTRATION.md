# Quick Fix for Listener Registration

## Current Error
```
Failed to set up listener profile
POST /api/listener/setup 401 in 2875ms
```

## Root Cause
The `/api/listener/setup` endpoint is returning **401 Unauthorized** because:
1. The user session isn't fully established after registration
2. The database trigger might not be creating profiles correctly
3. Email confirmation might be required in Supabase

## Quick Fixes Applied

### 1. Added Delay Before Listener Setup ✅
```typescript
// Wait 1.5 seconds for auth session to establish
await new Promise(resolve => setTimeout(resolve, 1500));
```

### 2. Better Error Messages ✅
```typescript
// Now shows actual error from API instead of generic message
const errorData = await listenerResponse.json();
throw new Error(errorData.error || 'Failed to set up listener profile');
```

## Critical: Apply Database Fix

**You MUST run this in Supabase SQL Editor:**

```sql
-- Copy the entire contents of FIX_PROFILE_CREATION_COMPLETE.sql
-- and run it in your Supabase Dashboard → SQL Editor
```

This fixes:
- ✅ Profile creation with account_type
- ✅ RLS policy issues
- ✅ Trigger running with SECURITY DEFINER

## Testing Steps

### Step 1: Verify Database Fix Applied

In Supabase SQL Editor, run:
```sql
-- Check if trigger includes account_type
SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
-- Should show 'account_type' in the function body

-- Check trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
-- Should return 1 row
```

### Step 2: Check Email Confirmation

1. Go to **Supabase Dashboard**
2. Navigate to **Authentication** → **Settings**  
3. Find **Email Auth** section
4. Look for "**Enable email confirmations**"

**If it's ON (enabled)**:
- Users must confirm email before they can login
- This is why you're getting 401
- **Solution for testing**: Turn it OFF

**To disable** (for testing only):
1. Uncheck "Enable email confirmations"
2. Click Save

### Step 3: Test Registration

1. Clear browser cookies (important!)
2. Go to listener registration page
3. Fill out the form
4. Submit

Expected behavior now:
- Registration completes
- 1.5 second delay
- Listener profile created
- Redirects to dashboard

### Step 4: If Still Getting 401

Check the browser console for the ACTUAL error message (it will now show the real error):

**Possible errors and solutions**:

| Error | Solution |
|-------|----------|
| "Not authenticated" | Email confirmation is still required |
| "User already exists" | Try a different email |
| "Invalid token" | Clear cookies and try again |
| RLS policy error | Database fix not applied |

## Verify Everything Works

After applying fixes, test this flow:

```bash
# 1. Register new listener
POST /api/auth/register
{
  "email": "test.listener@example.com",
  "password": "Test1234!",
  "full_name": "Test Listener",
  "account_type": "listener"
}

# Expected: 200 OK

# 2. Wait 1.5 seconds (automatic in form now)

# 3. Setup listener profile
POST /api/listener/setup
{
  "full_legal_name": "Test Listener",
  "email": "test.listener@example.com",
  "country": "USA",
  "city": "New York",
  "professional_title": "Counselor",
  "years_of_experience": 5,
  "specialization": ["anxiety", "depression"],
  "professional_bio": "Experienced mental health professional...",
  "auto_verify": true
}

# Expected: 200 OK with { "success": true, ... }
```

## Summary of All Fixes

✅ **Code fixes** (already applied):
- Added 1.5 second delay after registration
- Better error messages showing actual API errors
- Profile creation handled by trigger (not manual insert)

⚠️ **Database fixes** (YOU must apply):
1. Run `FIX_PROFILE_CREATION_COMPLETE.sql` in Supabase
2. Disable email confirmation in Supabase settings (for testing)

## Still Having Issues?

Check the API logs:

```typescript
// In src/app/api/listener/setup/route.ts, line 13
console.log('User from auth:', user);
console.log('Request body:', body);
```

Look for:
- Is `user` null? → Auth session not established
- Is `user` defined but still 401? → Check if profile exists in database
- Error creating listener? → Check RLS policies on listeners table

## Next Steps

1. ✅ Code is fixed (delay added, better errors)
2. ⚠️ **YOU MUST**: Run database migration in Supabase
3. ⚠️ **YOU MUST**: Disable email confirmation for testing
4. 🧪 Test registration flow
5. 📝 Check browser console for actual error if still fails
