# TalkFriendly Admin Dashboard Setup Guide

## Overview

The TalkFriendly admin dashboard uses a **private, secure credential-based authentication system**. Admin credentials are stored server-side as hashed values in environment variables, ensuring they are never exposed to the client or committed to source control.

## Security Features

- ✅ **No public admin registration** - Admin accounts cannot be created through the normal signup process
- ✅ **Server-side authentication** - Credentials verified server-side only, never exposed to client
- ✅ **Secure password hashing** - Uses Node.js crypto.scrypt for secure password hashing
- ✅ **Constant-time comparison** - Prevents timing-based attacks
- ✅ **Session management** - 12-hour sessions with secure token generation
- ✅ **Activity logging** - All admin actions logged with IP address and user agent
- ✅ **CSRF protection** - Secure session handling with proper cookie settings
- ✅ **No hardcoded credentials** - All credentials configured via environment variables

## Initial Setup

### Step 1: Create an Admin Profile in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your TalkFriendly project
3. Navigate to **Table Editor** → **profiles**
4. Create a new profile record or update an existing one with:
   - `id`: (UUID - this is auto-generated if creating new)
   - `username`: Your desired admin username
   - `email`: Admin email address
   - `full_name`: Your full name
   - `account_type`: **admin** (IMPORTANT!)
   - `is_active`: **true**
   - `is_verified`: **true**

5. **Copy the UUID** from the `id` column - you'll need this in the next step

### Step 2: Generate Admin Credentials

Run the credential generation script:

```bash
npx tsx scripts/generate-admin-credentials.ts
```

The script will prompt you for:
- Admin username (minimum 3 characters)
- Admin password (minimum 8 characters)
- Admin user UUID (from Step 1)

It will output a credential string like:

```
ADMIN_CREDENTIALS="admin:a1b2c3d4e5f6...:00000000-0000-0000-0000-000000000000"
```

### Step 3: Add Credentials to Environment Variables

#### For Local Development

Add the credential string to your `.env.local` file:

```bash
# Admin Authentication
ADMIN_CREDENTIALS="your_generated_credential_here"
```

#### For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `ADMIN_CREDENTIALS`
   - **Value**: Your generated credential string
   - **Environments**: Check **Production**, **Preview**, and **Development**
4. Click **Save**
5. Redeploy your application

#### For Production (Other Platforms)

Add the `ADMIN_CREDENTIALS` environment variable using your platform's secrets management:

- **Netlify**: Site settings → Build & deploy → Environment
- **Railway**: Variables tab in your project
- **AWS**: Systems Manager Parameter Store or Secrets Manager
- **Docker**: Pass as environment variable in your docker-compose.yml or Dockerfile

### Step 4: Restart Your Application

After adding the environment variable, restart your application:

```bash
# Local development
npm run dev

# Production
# Redeploy or restart your hosting service
```

### Step 5: Test Admin Login

1. Navigate to: `https://your-domain.com/admin/login`
2. Enter your admin username and password
3. You should be redirected to the admin dashboard

## Accessing the Admin Dashboard

### Admin Login URL

```
https://your-domain.com/admin/login
```

**Local Development:**
```
http://localhost:3000/admin/login
```

### Admin Dashboard URL

```
https://your-domain.com/admin/dashboard
```

## Managing Multiple Admin Users

You can configure multiple admin accounts by separating credentials with semicolons:

```bash
ADMIN_CREDENTIALS="admin1:hash1:uuid1;admin2:hash2:uuid2;admin3:hash3:uuid3"
```

To add a new admin:

1. Create a new profile in Supabase with `account_type='admin'`
2. Run the credential generation script again
3. Append the new credential to your existing `ADMIN_CREDENTIALS` variable
4. Restart the application

## Granting Admin Permissions

Admin permissions are managed through the `admin_permissions` table. To grant permissions:

### Via SQL (Supabase SQL Editor)

```sql
-- Grant super_admin permission
INSERT INTO public.admin_permissions (
  user_id,
  permission,
  granted_by,
  grant_reason,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Admin user UUID
  'super_admin',
  '00000000-0000-0000-0000-000000000000', -- Granted by (same admin or another)
  'Initial super admin setup',
  true
);
```

### Available Permissions

- `super_admin` - Full access to all features
- `manage_users` - Manage user accounts
- `manage_listeners` - Manage listener profiles
- `review_applications` - Review listener applications
- `manage_appointments` - Manage appointments and sessions
- `view_analytics` - View platform analytics
- `manage_moderation` - Content moderation
- `manage_reports` - Handle user reports
- `view_audit_logs` - View admin activity logs
- `manage_admins` - Manage other admin accounts

## Security Best Practices

### Password Requirements

- Minimum 8 characters (recommended: 12+ characters)
- Use a mix of uppercase, lowercase, numbers, and special characters
- Use a unique password not used elsewhere
- Consider using a password manager

### Credential Management

1. **Never commit credentials to Git**
   - Add `.env.local` to `.gitignore` (already done)
   - Never include credentials in code or documentation

2. **Rotate credentials periodically**
   - Change admin passwords every 90 days
   - Generate new credentials after any suspected compromise

3. **Limit admin access**
   - Only create admin accounts for authorized personnel
   - Use granular permissions instead of giving everyone `super_admin`
   - Disable admin accounts for former team members

4. **Monitor admin activity**
   - Regularly review the `admin_activity_log` table
   - Set up alerts for suspicious activity
   - Monitor login attempts from unusual locations

### Session Security

- Sessions expire after 12 hours of inactivity
- Sessions are tied to IP address and user agent
- All sessions are logged in `admin_sessions` table
- Admins should log out when finished

## Troubleshooting

### "Admin authentication is not configured"

**Cause**: The `ADMIN_CREDENTIALS` environment variable is not set.

**Solution**:
1. Verify you've added `ADMIN_CREDENTIALS` to your environment variables
2. Restart your application
3. Check for typos in the variable name

### "Invalid credentials"

**Causes**:
- Incorrect username or password
- Credential hash was generated incorrectly
- Environment variable not loaded properly

**Solutions**:
1. Double-check your username and password
2. Regenerate credentials using the script
3. Verify the environment variable is set correctly
4. Restart the application after updating environment variables

### "Admin account not found or inactive"

**Causes**:
- Profile with matching UUID doesn't exist
- Profile's `account_type` is not 'admin'
- Profile's `is_active` is false

**Solutions**:
1. Verify the profile exists in Supabase
2. Check that `account_type = 'admin'`
3. Check that `is_active = true`
4. Ensure the UUID in your credential matches the profile

### "Insufficient permissions"

**Cause**: Admin doesn't have required permissions.

**Solution**:
1. Grant appropriate permissions via `admin_permissions` table
2. Verify permissions are active (`is_active = true`)
3. Check permissions haven't expired (`expires_at`)

## Revoking Admin Access

To immediately revoke admin access:

### 1. Remove Environment Variable

Delete or comment out the admin's credential from `ADMIN_CREDENTIALS`

### 2. Deactivate Profile

```sql
UPDATE public.profiles
SET is_active = false
WHERE id = '00000000-0000-0000-0000-000000000000';
```

### 3. Revoke Permissions

```sql
UPDATE public.admin_permissions
SET 
  is_active = false,
  revoked_at = NOW(),
  revoked_by = 'system',
  revoke_reason = 'Admin access revoked'
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

### 4. Terminate Sessions

```sql
UPDATE public.admin_sessions
SET 
  is_active = false,
  revoked_at = NOW(),
  revoke_reason = 'Admin access revoked'
WHERE user_id = '00000000-0000-0000-0000-000000000000';
```

## Emergency Access Recovery

If you lose access to all admin accounts:

1. Access your Supabase database directly
2. Create a new admin profile (or update existing)
3. Generate new credentials using the script
4. Update your environment variables
5. Restart the application

## Additional Resources

- **Admin Activity Logs**: Review in `admin_activity_log` table
- **Active Sessions**: Monitor in `admin_sessions` table
- **Permissions**: Manage in `admin_permissions` table

## Support

For additional help or security concerns, contact your development team or refer to the main project documentation.

---

**Remember**: Admin access should be tightly controlled. Only authorized personnel should have admin credentials, and all admin activity is logged and auditable.
