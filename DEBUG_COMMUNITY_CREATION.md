# Debug Community Creation - Logging Guide

## ✅ Logging Has Been Added

Detailed logging has been added to **3 layers** to help identify the exact error:

---

## 📍 Where to Find Logs

### 1. **Browser Console (Frontend)**
**Location:** Press F12 → Console tab

**What you'll see:**
```
=== FRONTEND: Create Community Submit ===
Form data: {
  "name": "Test Community",
  "description": "Test description",
  ...
}
Calling communityService.createCommunity...
```

**If error occurs:**
```
❌ FRONTEND: Create community failed: [error details]
Error details: {
  name: "Error",
  message: "actual error message here",
  stack: "full stack trace"
}
```

---

### 2. **Service Layer (Browser Console)**
**Location:** Same F12 Console

**What you'll see:**
```
=== SERVICE: createCommunity START ===
Payload: {
  "name": "Test Community",
  ...
}
User from service: {
  "userId": "uuid-here",
  "email": "user@example.com"
}
Service insert payload: {
  ...includes owner_id...
}
```

**If error occurs:**
```
❌ Service Supabase error: {
  message: "specific database error",
  details: "...",
  hint: "...",
  code: "error_code"
}
```

---

### 3. **API Route (Server Console)**
**Location:** 
- **Development:** Terminal where you ran `npm run dev`
- **Production:** Vercel dashboard → Functions → Logs

**What you'll see:**
```
=== COMMUNITY CREATION START ===
Auth check: {
  userId: "uuid-here",
  authError: null
}
Request body: {
  "name": "Test Community",
  ...
}
Insert data: {
  ...includes owner_id...
}
```

**If error occurs:**
```
❌ Supabase insert error: {
  message: "specific error",
  details: "...",
  hint: "...",
  code: "42501" (example error code)
}
```

---

## 🧪 How to Test

### Step 1: Open Browser Console
1. Press **F12** (or right-click → Inspect)
2. Click **Console** tab
3. Clear any existing logs (trash icon)

### Step 2: Open Terminal (for server logs)
If running locally:
```bash
# Make sure dev server is running
npm run dev
```
Watch this terminal for server-side logs.

### Step 3: Try Creating Community
1. Go to Communities page
2. Click "Create" button
3. Fill out form:
   - Name: "Test Debug Community"
   - Description: "Testing error logging"
   - Category: Any
4. Click "Create Community"

### Step 4: Check Logs
**Immediately check:**
1. ✅ Browser console (F12)
2. ✅ Terminal (where npm run dev is running)

---

## 🔍 What to Look For

### Common Error Codes

#### `42501` - Insufficient Privilege
**Meaning:** RLS policy is blocking the insert
**Solution:** Check if you're authenticated and RLS policies are correct

#### `23502` - Not Null Violation
**Meaning:** Required column is null
**Example:** `null value in column "owner_id" violates not-null constraint`
**Solution:** Check that owner_id is being set

#### `23505` - Unique Violation
**Meaning:** Duplicate value in unique column
**Example:** Community name already exists
**Solution:** Try different name

#### `42703` - Undefined Column
**Meaning:** Column doesn't exist in table
**Example:** `column "owner_id" of relation "communities" does not exist`
**Solution:** Migration wasn't applied properly

---

## 📋 Checklist

Before reporting the issue, please provide:

- [ ] **Browser console logs** (copy entire output starting from "=== FRONTEND")
- [ ] **Server console logs** (copy entire output starting from "=== COMMUNITY CREATION START")
- [ ] **Network tab response** (F12 → Network → communities → Response)
- [ ] **Your user ID** (from browser console: run `localStorage.getItem('sb-access-token')`)
- [ ] **Database verification** (run VERIFY_COMMUNITY_SETUP.sql)

---

## 🚀 Quick Verification

Run this in **Browser Console** to check auth:
```javascript
// Check if you're logged in
console.log('Auth status:', localStorage.getItem('sb-access-token') ? 'Logged in' : 'Not logged in');
```

Run this in **Supabase SQL Editor** to check schema:
```sql
-- Check if owner_id exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'communities' 
AND column_name = 'owner_id';
```

---

## 📝 Example Error Report Format

When sharing logs, use this format:

```
### Browser Console (Frontend + Service):
[paste everything from console]

### Server Console (Terminal):
[paste server logs]

### Network Response:
[paste response from Network tab]

### Database Check:
[paste result of VERIFY_COMMUNITY_SETUP.sql]
```

---

## 🎯 Next Steps

1. ✅ Try creating a community
2. ✅ Check browser console (F12)
3. ✅ Check terminal/server logs
4. ✅ Copy ALL the logs
5. ✅ Share the logs with me

**The logs will tell us EXACTLY what's wrong!**

---

**Created:** September 19, 2026  
**Files Modified:**
- `src/app/api/communities/route.ts` (server logs)
- `src/services/community.service.ts` (service logs)
- `src/features/communities/CommunitiesView.tsx` (frontend logs)
