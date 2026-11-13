# Admin Dashboard Access - Quick Reference

## 🔑 Admin Login

**URL:** `/admin/login`

- **Local:** http://localhost:3000/admin/login
- **Production:** https://your-domain.com/admin/login

## 📊 Admin Dashboard

**URL:** `/admin/dashboard`

After successful login, you'll be redirected automatically.

## ⚡ Quick Setup

### 1. Create Admin Profile in Supabase

```sql
-- In Supabase SQL Editor
INSERT INTO public.profiles (
  id,
  username,
  email,
  full_name,
  account_type,
  is_active,
  is_verified
) VALUES (
  gen_random_uuid(), -- Or use specific UUID
  'admin',
  'admin@yourdomain.com',
  'Admin User',
  'admin',
  true,
  true
) RETURNING id; -- Copy this UUID
```

### 2. Generate Credentials

```bash
npm run admin:generate-credentials
```

Follow the prompts and copy the generated credential.

### 3. Add to Environment

Add to `.env.local`:

```bash
ADMIN_CREDENTIALS="username:hash:uuid"
```

### 4. Restart & Login

```bash
npm run dev
```

Visit `/admin/login` and use your username and password.

## 🔒 Security Notes

- **Private Access:** The admin login route is not advertised publicly
- **No Public Registration:** Admin accounts cannot be created through normal signup
- **Server-Side Auth:** All authentication happens server-side
- **Session Security:** 12-hour sessions with secure tokens
- **Activity Logging:** All admin actions are logged

## 🚨 Important

- Never share admin credentials
- Never commit credentials to Git
- Use strong passwords (12+ characters)
- Rotate credentials regularly
- Monitor admin activity logs

## 📚 Full Documentation

See `ADMIN_SETUP_GUIDE.md` for complete setup instructions and troubleshooting.
