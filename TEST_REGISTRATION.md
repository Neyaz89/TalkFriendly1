# Test Listener Registration

## Quick Diagnostic

Run these checks to identify the issue:

### Check 1: Has Database Fix Been Applied?

In **Supabase SQL Editor**, run:

```sql
-- 1. Check if trigger exists and is active
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Should return 1 row with:
-- trigger_name: on_auth_user_created
-- event_manipulation: INSERT
-- event_object_table: users
```

```sql
-- 2. Check if function includes account_type
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Should see 'account_type' in the output
-- Look for: COALESCE(NEW.raw_user_meta_data->>'account_type', 'user')
```

```sql
-- 3. Check RLS policies on profiles
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- Should show 3 policies:
-- - Users can view all profiles (SELECT)
-- - Users can update own profile (UPDATE)
-- - Users can insert own profile (INSERT)
```

**If any of these checks fail** → Run `FIX_PROFILE_CREATION_COMPLETE.sql` in Supabase SQL Editor

---

### Check 2: Is Email Confirmation Enabled?

1. Open **Supabase Dashboard**
2. Go to **Authentication** → **Settings**
3. Scroll to **Email Auth** section
4. Check "Enable email confirmations"

**If CHECKED (enabled)**:
- This is your problem!
- Users can't authenticate until they confirm email
- **Solution**: Uncheck it for testing

**If UNCHECKED (disabled)**:
- Email confirmation is not the issue
- Continue to Check 3

---

### Check 3: Test Registration Manually

Open browser DevTools Console and run:

```javascript
// Test 1: Register a listener
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'debug.test@example.com',
    password: 'Debug123!',
    username: 'debuguser',
    full_name: 'Debug User',
    account_type: 'listener'
  })
})
.then(r => r.json())
.then(d => console.log('Registration result:', d))
.catch(e => console.error('Registration error:', e));
```

**Expected Output**:
```json
{
  "message": "Registration successful",
  "user": { "id": "...", "email": "debug.test@example.com" },
  "account_type": "listener"
}
```

**If you get an error**, note the message and check:
- "User already exists" → Email is taken, try different email
- "Email rate limit" → Wait 60 seconds or use different email
- Other error → Note it down

---

```javascript
// Test 2: Wait for auth, then check session
setTimeout(async () => {
  const response = await fetch('/api/auth/me');
  const data = await response.json();
  console.log('Current user:', data);
}, 2000);
```

**Expected Output**:
```json
{
  "user": {
    "id": "...",
    "email": "debug.test@example.com",
    "user_metadata": { "account_type": "listener" }
  }
}
```

**If you get `null` or `401`**:
- Session not established
- Email confirmation might be required
- Cookies not being set properly

---

```javascript
// Test 3: Setup listener profile
setTimeout(async () => {
  const response = await fetch('/api/listener/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_legal_name: 'Debug User',
      email: 'debug.test@example.com',
      country: 'USA',
      city: 'Test City',
      professional_title: 'Test Counselor',
      years_of_experience: 5,
      specialization: ['anxiety', 'depression'],
      professional_bio: 'This is a test bio that is longer than 50 characters to meet the minimum requirement.',
      auto_verify: true
    })
  });
  const data = await response.json();
  console.log('Listener setup:', response.status, data);
}, 3000);
```

**Expected Output**:
```json
{
  "success": true,
  "message": "Listener profile created and verified!"
}
```

**If you get 401**:
- Check Test 2 results - is user authenticated?
- If not, email confirmation is likely the issue

**If you get 500 with error**:
- Note the error message
- Might be database/RLS issue

---

### Check 4: Verify Profile Was Created

In **Supabase Dashboard** → **Table Editor** → **profiles**:

Look for the user you just registered:
- Does the profile exist?
- Does it have `account_type = 'listener'`?
- Is `email` populated?

**If profile doesn't exist**:
- Trigger is not working
- Run `FIX_PROFILE_CREATION_COMPLETE.sql`

**If profile exists but account_type is NULL**:
- Old trigger version
- Run `FIX_PROFILE_CREATION_COMPLETE.sql`

---

### Check 5: Verify Listener Record Was Created

In **Supabase Dashboard** → **Table Editor** → **listeners**:

Look for a listener with the user's email:
- Does the listener record exist?
- Is `verification_status = 'verified'`?
- Is `user_id` matching the profile id?

**If listener doesn't exist**:
- The `/api/listener/setup` failed
- Check error message from Test 3

---

## Common Issues & Solutions

### Issue: "Not authenticated" (401)

**Cause**: Auth session not established

**Solutions**:
1. ✅ Disable email confirmation in Supabase
2. ✅ Add delay before calling listener setup (already done)
3. ✅ Clear browser cookies and try again
4. Check if cookies are being set (DevTools → Application → Cookies)

---

### Issue: "Profile creation error" / RLS violation

**Cause**: Database trigger not working or RLS policies too strict

**Solutions**:
1. ✅ Run `FIX_PROFILE_CREATION_COMPLETE.sql` in Supabase
2. Check if trigger is active (Check 1 above)
3. Verify function uses SECURITY DEFINER

---

### Issue: "User already exists"

**Cause**: Email is already registered

**Solutions**:
1. Use a different email for testing
2. Or delete the existing user in Supabase:
   ```sql
   DELETE FROM auth.users WHERE email = 'test@example.com';
   DELETE FROM profiles WHERE email = 'test@example.com';
   ```

---

### Issue: "Email rate limit exceeded"

**Cause**: Too many registration attempts

**Solutions**:
1. Wait 60 seconds
2. Use a different email address
3. Or use a different browser/incognito mode

---

## Success Criteria

All tests should pass:
- ✅ Trigger exists and includes account_type
- ✅ Email confirmation is disabled (for testing)
- ✅ Registration returns 200 with user object
- ✅ User session exists after 2 seconds
- ✅ Listener setup returns 200 with success
- ✅ Profile exists in database with account_type='listener'
- ✅ Listener record exists with verification_status='verified'

If all pass, registration should work! 🎉

---

## Report Template

If still having issues, provide these details:

```
1. Database Trigger Check:
   - Trigger exists: YES/NO
   - Includes account_type: YES/NO

2. Email Confirmation:
   - Enabled in Supabase: YES/NO

3. Test Results:
   - Registration: SUCCESS/FAILED (error: ___)
   - User session: SUCCESS/FAILED (error: ___)
   - Listener setup: SUCCESS/FAILED (error: ___)

4. Database Checks:
   - Profile created: YES/NO
   - account_type value: ___
   - Listener created: YES/NO

5. Browser Console Errors:
   [Paste any errors here]
```
